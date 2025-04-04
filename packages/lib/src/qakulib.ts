//import { Codex } from "@codex-storage/sdk-js";
import { Dispatcher, DispatchMetadata, Signer} from "waku-dispatcher"
import { AnsweredMessage, ControlMessage, EnhancedQuestionMessage, Id, LocalPoll, MessageType, ModerationMessage, NewPoll, Poll, PollActive, PollVote, QakuEvents, QakuState, QAList, QAType, QuestionMessage, QuestionShow, QuestionSort, UpvoteMessage } from "./types.js";
import { createEncoder, LightNode, utf8ToBytes,  } from "@waku/sdk";
import { Protocols } from "@waku/interfaces"
import { CONTENT_TOPIC_MAIN } from "./constants.js";
import { sha256 } from "js-sha256";
import { EventEmitter } from "events";
import { Identity } from "./identity.js";
import { qaHash, questionHash } from "./utils.js";
import sortArray from "sort-array";
import { Store } from "../../../../waku-dispatcher/dist/storage/store.js";
import { contentTopicToShardIndex, pubsubTopicsToShardInfo } from "@waku/utils"
import { History } from "./history/history.js";
import { HistoryTypes } from "./history/types.js";


export class Qaku extends EventEmitter {
    //codexURL:string = "" 

    state:QakuState = QakuState.UNDEFINED

    node:LightNode | undefined = undefined
    history:History = new History()
    dispatcher:Dispatcher | null = null
    //controlState:ControlMessage | undefined = undefined
    identity:Identity | undefined = undefined

   // currentId: string | undefined = undefined

    //questions:QuestionList = new Map<string, EnhancedQuestionMessage>()
    //polls:LocalPoll[] = []

    qas:QAList = new Map<Id, QAType>()

    constructor(node:LightNode | undefined) {
        super();

        this.node = node
    }

    public async init() {
        if (this.state == QakuState.INITIALIZED) {
            console.error("Already initialized")
            return
        }
        this.state = QakuState.INITIALIZING
        this.emit(QakuEvents.QAKU_STATE_UPDATE, this.state)

        try {
            await this.node!.waitForPeers([Protocols.Filter, Protocols.LightPush, Protocols.Store]);
            if(!this.dispatcher) {
                const s = new Store("qaku")
                const disp = new Dispatcher(this.node as any, "", false, s)
                //const d = await getDispatcher(this.node as any, "", "qaku-"+id, false, false)
                if (!disp) {
                    throw new Error("Failed to initialize Waku Dispatcher")
                }
                this.dispatcher = disp 
        
                this.state = QakuState.INIT_IDENTITY
                this.emit(QakuEvents.QAKU_STATE_UPDATE, this.state)
                this.identity = new Identity("qaku-wallet", "qaku-key-v2") //fixme
                await this.identity.init()
        
                this.state = QakuState.INITIALIZED
                this.emit(QakuEvents.QAKU_STATE_UPDATE, this.state)

                
            }
            if (!this.dispatcher) {
                this.state = QakuState.FAILED
                this.emit(QakuEvents.QAKU_STATE_UPDATE, this.state)

                return
            }


        } catch(e) {
            this.state = QakuState.FAILED
            this.emit(QakuEvents.QAKU_STATE_UPDATE, this.state)

            throw e
        }
    }

    public async initQA(id:string, password?:string) {
        const initializedQa = this.qas.get(id)
        if (initializedQa) {
            console.log("QA already initialized", id)
            return
        }

        //await this.dispatcher?.stop()

        let s: Store
        try {
            s = new Store(`qaku-${id}`)   
        } catch(e) {
            console.error(e)
            throw e
        }  
        const disp = new Dispatcher(this.node as any, "", false, s)
        if (!disp) {
            throw new Error("Failed to init QA: dispatcher recreation failed")
        }

        const qa = {dispatcher: disp, controlState: undefined, polls: [], questions: new Map<string, EnhancedQuestionMessage>()}
        this.qas.set(id, qa)

        await disp.initContentTopic(CONTENT_TOPIC_MAIN(id))

        if (password) {
            disp.registerKey(utf8ToBytes(sha256(password)).slice(0, 32), 0, true)
        }
        console.debug(MessageType.CONTROL_MESSAGE)
        disp.on(MessageType.CONTROL_MESSAGE, this.handleControlMessage.bind(this), true, disp.autoEncrypt)
        console.debug(MessageType.QUESTION_MESSAGE)
        disp.on(MessageType.QUESTION_MESSAGE, this.handleNewQuestion.bind(this, id), false, disp.autoEncrypt)
        console.debug(MessageType.UPVOTE_MESSAGE)
        disp.on(MessageType.UPVOTE_MESSAGE, this.handleUpvote.bind(this, id), true, disp.autoEncrypt)
        console.debug(MessageType.ANSWERED_MESSAGE)
        disp.on(MessageType.ANSWERED_MESSAGE, this.handleAnsweredMessage.bind(this, id), true, disp.autoEncrypt)
        console.debug(MessageType.MODERATION_MESSAGE)
        disp.on(MessageType.MODERATION_MESSAGE, this.handleModerationMessage.bind(this, id), true, disp.autoEncrypt)

        disp.on(MessageType.POLL_CREATE_MESSAGE, this.handlePollCreateMessage.bind(this, id), true, disp.autoEncrypt)
        disp.on(MessageType.POLL_VOTE_MESSAGE, this.handlePollVoteMessage.bind(this, id), true, disp.autoEncrypt)
        disp.on(MessageType.POLL_ACTIVE_MESSAGE, this.handlePollActiveMessage.bind(this,id), true, disp.autoEncrypt)
        await disp.start()

        if (!this.history.get(id))
            this.history.add(id, HistoryTypes.VISITED, password=password)
        //this.currentId = id
        try {
            await this.node!.waitForPeers([Protocols.Store]);

            console.log("Dispatching local query")
            await disp.dispatchLocalQuery() 

            console.log(qa.questions)

            if (qa.questions.size == 0) {
                console.log("Dispatching general query")
                await disp.dispatchQuery()
                console.log(qa.questions)
            }

            this.emit(QakuEvents.QAKU_STATE_UPDATE, {state: QakuState.INIT_PROTOCOL, id: id})
        } catch (e) {
            console.error("Failed to initialized protocol:", e)
            this.emit(QakuEvents.QAKU_STATE_UPDATE, QakuState.FAILED)
            throw e
        }
    }

    private handleControlMessage(payload: ControlMessage, signer: Signer, _3:DispatchMetadata): void {
        if (!payload.title) throw new Error("control message: title missing")
        if (!payload.description) payload.description = ""
        if (signer != payload.owner) throw new Error("control message: signer not owner")

        const qa = this.qas.get(payload.id)
        if (!qa) throw new Error("control message: QA not found")
        if (qa.controlState != undefined && qa.controlState.owner != signer) throw new Error("control message: owner changed")
        if (qa.controlState != undefined && qa.controlState.updated > payload.updated) throw new Error("control message: too old") //might need to come up with some merging strategy as this basically ignores updates which come out of order
        console.debug("Setting Control State")
        qa.controlState = payload

        this.history.update({
            id: payload.id,
            title: payload.title,
            description: payload.description,
            createdAt: payload.timestamp,
            isActive: payload.enabled,
            pollsCnt: 0,
            questionsCnt: 0
        })

        if (payload.admins.includes(this.identity!.address()))
            this.history.updateType(payload.id, HistoryTypes.ADMIN)

        this.emit(QakuEvents.NEW_CONTROL_MESSAGE, qa.controlState.id)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, qa.controlState.id)

    }

    private handleNewQuestion(id: Id, payload: QuestionMessage, signer: Signer, meta:DispatchMetadata): void {
        if (!payload.question || payload.question.length == 0) throw new Error("new question: question empty")

        const qa = this.qas.get(id)
        if (!qa) throw new Error("new question: QA not found")

        if (!qa.controlState?.enabled) {
            throw new Error("new question: Q&A closed")
        }

        const hash = sha256(JSON.stringify(payload))
        if (qa.questions.has(hash)) {
            throw new Error("new question: duplicate")
        }

        const q: EnhancedQuestionMessage = {
            hash: hash,
            question: payload.question,
            timestamp: payload.timestamp || new Date(meta.timestamp || Date.now()),
            moderated: false,
            answer: undefined,
            answered: false,
            answeredBy: undefined,
            upvotedByMe: false,
            upvotes: 0,
            upvoters: [],
            signer: signer,
        }
        qa.questions.set(hash, q) 
        const historyEntry = this.history.get(id)
        if (historyEntry && (!historyEntry.questionsCnt || qa.questions.size > historyEntry.questionsCnt)) {
            this.history.incQuestionCnt(id)
        }
        this.emit(QakuEvents.NEW_QUESTION, id)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, id)
    }

    private handleUpvote (id: Id, payload: AnsweredMessage, signer: Signer): void {
        if (!signer) throw new Error("upvote: not signed")
        
        const qa = this.qas.get(id)
        if (!qa) throw new Error("upvote: QA not found")
        if (!qa.controlState?.enabled) throw Error("upvote: Q&A closed")

        const q =  qa.questions.get(payload.hash)
        if (!q) throw new Error("upvote: unknown question")

        if ((q.upvotedByMe && signer == this.identity!.address()) || q.upvoters.includes(signer)) throw new Error("upvote: already voted")
        if (q.answered) throw new Error("upvote: already answered")
        if (q.moderated) throw new Error("upvote: moderated")

        q.upvotes++

        if (signer === this.identity!.address()) {
            q.upvotedByMe = true
        }
        q.upvoters.push(signer)

        qa.questions.set(payload.hash, q)
        this.emit(QakuEvents.NEW_UPVOTE, id)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, id)
    }

    private handleAnsweredMessage (id: Id, payload: AnsweredMessage, signer: Signer): void {
        if (!signer) throw new Error("answer: not signed")
                
        const qa = this.qas.get(id)
        if (!qa) throw new Error("answer: QA not found")

        if (qa.controlState?.owner != signer && !qa.controlState?.admins.includes(signer)) throw new Error("answer: unauthorized to answer")

        const q = qa.questions.get(payload.hash)
        if (!q) throw new Error("answer: unknown question")


        if (q.answered) throw new Error("answer: already answered")
        q.answered = true
        q.answer = payload.text
        q.answeredBy = signer

        qa.questions.set(payload.hash, q)
        this.emit(QakuEvents.NEW_ANSWER, id)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, id)
    }

    private handleModerationMessage (id: Id, payload: ModerationMessage, signer: Signer): void {
        if (!signer) throw new Error("moderate: not signed")

        const qa = this.qas.get(id)
        if (!qa) throw new Error("moderate: QA not found")

        if (qa.controlState?.owner != signer && !qa.controlState?.admins.includes(signer)) throw new Error("moderate: unauthorized to answer")

        const q = qa.questions.get(payload.hash)
        if (!q) throw new Error("mdoerate: unknown question")


        q.moderated = payload.moderated

        qa.questions.set(payload.hash, q)
        this.emit(QakuEvents.NEW_MODERATION, id)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, id)
    }

    private handlePollCreateMessage(id: Id, payload: NewPoll, signer: Signer) {
        if (!signer) throw new Error("poll: not signed")
  
        const qa = this.qas.get(id)
        if (!qa) throw new Error("poll: QA not found")

        if (qa.controlState?.owner != signer && !qa.controlState?.admins.includes(signer) || signer != payload.creator) {
            throw new Error("poll: unauthorized to create")
        }

        const poll:LocalPoll = {...payload.poll, owner: signer}
        
        if (qa.polls.find((p:LocalPoll) => p.id == poll.id)) throw new Error("poll: already exists")

        qa.polls.push(poll)
        const historyEntry = this.history.get(id)
        if (historyEntry && (!historyEntry.pollsCnt || qa.polls.length > historyEntry.pollsCnt)) {
            this.history.incPollCnt(id)
        }

        this.emit(QakuEvents.NEW_POLL, id)
    }

    private handlePollVoteMessage(id: Id, payload: PollVote, signer: Signer) {
        if (!signer) throw new Error("poll vote: not signed")

        const qa = this.qas.get(id)
        if (!qa) throw new Error("upvote: QA not found")

        const poll = qa.polls.find((p) => p.id == payload.id)
        if (!poll) throw new Error("poll vote: unknown poll")
        if (!poll.active) throw new Error("poll vote: inactive")

        if (!poll.votes) poll.votes = [...poll.options.map(() => ({voters: []}))]
        if (!poll.votes[payload.option].voters) poll.votes[payload.option].voters = []

        if (poll.votes[payload.option].voters.indexOf(signer as string) < 0) {
            poll.votes[payload.option].voters.push(signer as string)
            if (!poll.voteCount) poll.voteCount = 0
            poll.voteCount++
        }
        //is it by reference?

        this.emit(QakuEvents.NEW_POLL_VOTE, id)
    }

    private handlePollActiveMessage(id: Id, payload: PollActive, signer: Signer) {
        if (!signer) throw new Error("poll active: not signed")
        
        const qa = this.qas.get(id)
        if (!qa) throw new Error("upvote: QA not found")

        if (qa.controlState?.owner != signer && !qa.controlState?.admins.includes(signer)) {
            throw new Error("poll active: unauthorized")
        }

        const poll = qa.polls.find((p) => p.id == payload.id)
        if (!poll) throw new Error("poll vote: unknown poll")
        poll.active = payload.active

        this.emit(QakuEvents.POLL_STATE_CHANGE, id)
    }

    public async newQA(title:string, desc:string | undefined, enabled:boolean, admins:string[], moderation:boolean, password?:string):Promise<string> {
        if (!this.node || !this.dispatcher) throw new Error("Qaku is not properly initialized")
        const ts = new Date();
        console.log(title + ts.valueOf() + this.identity!.address())
        let hash = qaHash(title, ts.valueOf(), this.identity!.address())
        console.log(hash)

        let key: any | undefined = undefined
        if (password) {
            key = {key: utf8ToBytes(sha256(password)).slice(0, 32), type: 0}
            hash = "X"+hash //prepend X to inform the app that this QA is encrypted
        }

        const cmsg:ControlMessage = {
            title: title,
            description: desc || "",
            id: hash,
            enabled: enabled,
            timestamp: ts.valueOf(),
            owner: this.identity!.address(),
            admins: admins,
            moderation: moderation,
            updated: ts.valueOf()
        }

        //await destroyDispatcher()

        await this.initQA(hash, password)
        const qa = this.qas.get(hash)
        if (!qa) throw new Error("Failed to find QA after initialization")

        const contentTopic = CONTENT_TOPIC_MAIN(hash)
        const pubsubTopics = this.node.connectionManager.pubsubTopics
        const shardInfo = pubsubTopicsToShardInfo(pubsubTopics)
        const shardIndex = contentTopicToShardIndex(contentTopic, shardInfo.shards.length)
        //dispatcher.on(MessageType.CONTROL_MESSAGE, () => {})
        const encoder = createEncoder({ contentTopic: contentTopic, ephemeral: false, pubsubTopicShardInfo: {clusterId: shardInfo.clusterId, shard: shardIndex} })
        const result = await qa.dispatcher!.emitTo(encoder, MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet(), key, true)
        console.debug(result)
        if (result) {
            try {
                this.history.add(hash, HistoryTypes.CREATED, password, title, ts.valueOf(), enabled, desc)
            } catch(e) {
                this.history.update({id: hash, password: password, title: title, type: HistoryTypes.CREATED, createdAt: ts.valueOf(), isActive: enabled, description: desc || "", pollsCnt: 0, questionsCnt: 0})
            }
            return hash
        } else {
            console.error("Failed to create the Q&A", result)
            throw new Error(result)
        }

        return ""
    }

    public async switchQAState(id: Id, newState:boolean) {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }
        const cmsg:ControlMessage = {
            title: qa.controlState.title,
            description: qa.controlState.description,
            id: qa.controlState.id,
            enabled: newState,
            timestamp: qa.controlState.timestamp,
            updated: Date.now(),
            owner: qa.controlState.owner,
            admins: qa.controlState.admins,
            moderation: qa.controlState.moderation
        }
        
        const result = qa.dispatcher.emit(MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet())
        if (!result) {
            throw new Error("Failed to switch QA state")
        }
    }

    public async removeAdmin(id: Id, admin:string) {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }

        const newAdmins = qa.controlState.admins.filter((a:string) => a != admin)

        const cmsg:ControlMessage = {
            title: qa.controlState.title,
            description: qa.controlState.description,
            id: qa.controlState.id,
            enabled: qa.controlState.enabled,
            timestamp: qa.controlState.timestamp,
            updated: Date.now(),
            owner: qa.controlState.owner,
            admins: newAdmins,
            moderation: qa.controlState.moderation
        }
        
        const result = qa.dispatcher.emit(MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet())
        if (!result) {
            throw new Error("Failed to switch QA state")
        }
    }

    public async setAdmins(id: Id, admins:string[]) {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }

        const cmsg:ControlMessage = {
            title: qa.controlState.title,
            description: qa.controlState.description,
            id: qa.controlState.id,
            enabled: qa.controlState.enabled,
            timestamp: qa.controlState.timestamp,
            updated: Date.now(),
            owner: qa.controlState.owner,
            admins: admins,
            moderation: qa.controlState.moderation
        }
        
        const result = qa.dispatcher.emit(MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet())
        if (!result) {
            throw new Error("Failed to switch QA state")
        }
    }
    

    public async newQuestion(id: Id, question:string):Promise<string | undefined> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }
        
        const qmsg:QuestionMessage = {question: question, timestamp: new Date()}
        const result = await qa.dispatcher.emit(MessageType.QUESTION_MESSAGE, qmsg)
        if (result) {
            this.history.updateType(id, HistoryTypes.PARTICIPATED)

            this.emit(QakuEvents.NEW_QUESTION_PUBLISHED, qa.controlState.id, this.identity!.getWallet())
            return questionHash(qmsg)
        }  

        console.error("Failed to publish a question")
        return undefined
    }

    public async upvote(id: Id, questionHash:string):Promise<boolean> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }
        const amsg:UpvoteMessage = {hash: questionHash}
        const result = await qa.dispatcher.emit(MessageType.UPVOTE_MESSAGE, amsg, this.identity!.getWallet())

        if (result) {
            this.history.updateType(id, HistoryTypes.PARTICIPATED)

            this.emit(QakuEvents.NEW_UPVOTE_PUBLISHED, questionHash)
            return true
        }

        console.error("Failed to upvote the question", questionHash)
        return false
    }

    public async answer(id: Id, questionHash:string, answer?:string):Promise<boolean> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }

        const amsg:AnsweredMessage = { hash: questionHash, text: answer }
        const result = await qa.dispatcher.emit(MessageType.ANSWERED_MESSAGE, amsg, this.identity!.getWallet())

        if (result) {
            this.emit(QakuEvents.NEW_ANSWER_PUBLISHED, questionHash)
            return true
        }

        console.error("Failed to publish answer for the question", questionHash)
        return false
    }

    public async moderate(id: Id, questionHash:string, moderated:boolean):Promise<boolean> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }
        const mmsg:ModerationMessage = { hash: questionHash, moderated: moderated }
        const result = await qa.dispatcher.emit(MessageType.MODERATION_MESSAGE, mmsg, this.identity!.getWallet())

        if (result) {
            this.emit(QakuEvents.NEW_MODERATION_PUBLISHED, questionHash)
            return true
        }
        console.error("Failed to moderate the message", questionHash)
        return false
    }

    public async newPoll(id: Id, poll: Poll):Promise<boolean> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }

        const ts = Date.now()
        const newPoll:NewPoll = {
            creator: this.identity!.address(),
            poll: {
                active: poll.active,
                options: poll.options,
                question: poll.question,
                title: poll.title,
                id: sha256(`poll-${poll.question}-${ts}`),
            },
            timestamp: ts
        }

        const result = await qa.dispatcher.emit(MessageType.POLL_CREATE_MESSAGE, newPoll, this.identity!.getWallet())
        if (result) {
            this.emit(QakuEvents.NEW_POLL_PUBLISHED, newPoll.poll.id)
            return true
        }
        console.error("Failed to create a new poll", poll)
        return false
    }

    public async pollVote(id: Id, pollId: string, option: number):Promise<boolean> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }

        const res = await qa.dispatcher.emit(MessageType.POLL_VOTE_MESSAGE, {id: pollId, option: option} as PollVote, this.identity!.getWallet())

        if (!res) {
            console.error("Failed to vote on poll", pollId, option)
            return false
        }

        this.history.updateType(id, HistoryTypes.PARTICIPATED)
        return true
    }

    public async pollActive(id: Id, pollId: string, newState: boolean):Promise<boolean> {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        if (!qa.dispatcher) throw new Error("QA's Dispatcher not initialized properly")

        if (!qa.controlState) {
            throw new Error("Q&A not initialized")
        }

        const res = await qa.dispatcher.emit(MessageType.POLL_ACTIVE_MESSAGE, {id: pollId, active: newState} as PollActive, this.identity!.getWallet())
        if (!res) {
            console.error("Failed to set poll active state", pollId, newState)  
            return false
        }
        return true
    }

    public getQuestions(id: Id, sortBy:QuestionSort[], show:QuestionShow[] = [QuestionShow.ALL]) {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        let q = Array.from(qa.questions.values())
        
        q = q.filter((v:EnhancedQuestionMessage) => {
            let res = false
            if (show.length == 1 && show[0] == QuestionShow.ALL) return true
            for (const s of show) {
                switch (s) {
                    case QuestionShow.ANSWERED:
                        return v.answered
                    case QuestionShow.MODERATED:
                        return v.moderated
                    case QuestionShow.UNANSWERED:
                        return !v.answered
                    default:
                        break;
                }
            }

            return res
        })



        let by:string[] = []
        let order:string[] = []

        for (const s of sortBy) {
            switch (s) {
                case QuestionSort.TIME_DESC:
                    by.push('timestamp')
                    order.push('desc')
                    break;
                case QuestionSort.TIME_ASC:
                    by.push('timestamp')
                    order.push('asc')
                    break;
                case QuestionSort.UPVOTES_DESC:
                    by.push('upvotes')
                    order.push('desc')
                    break
                case QuestionSort.UPVOTES_ASC:
                    by.push('upvotes')
                    order.push('asc')
                    break;
                case QuestionSort.ANSWERED_ASC:
                    by.push('answered')
                    order.push('asc')    
                    break;
                case QuestionSort.ANSWERED_DESC:
                    by.push('answered')
                    order.push('desc')    
                    break;
                default:
                    break;
            }
        }

        if (by.length == 0) {
            by.push('timestamp')
            order.push('asc')
        }

        return sortArray(q, {by: by, order: order})


    }

    public getPolls(id: Id) {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("failed to find QA")

        return qa.polls
    }


/*
    public checkCodexAvailable = async ():Promise<boolean> => {
        const codex = new Codex(this.codexURL);
        const res = await codex.debug.info()
        if (res.error) {
            //setCodexAvailable(false)
            return false
        }
        if (res.data.table.nodes.length < 5) {
            //setCodexAvailable(false)
            return false
        }

        //setCodexAvailable(true)
        return true
    }
*/
    public async destroy(id: Id) {
        const qa = this.qas.get(id)
        if (!qa) return

        
        qa.controlState = undefined
        qa.questions = new Map<string, EnhancedQuestionMessage>()
        qa.polls = []
        //this.state = QakuState.UNDEFINED
        await qa.dispatcher?.stop()
        qa.dispatcher = null

        //this.currentId = undefined
    }

    public async destroyAll() {
        this.state = QakuState.UNDEFINED
        this.identity = undefined
        this.node = undefined
        //this.currentId = undefined

        for (const id of this.qas.keys()) {
            this.destroy(id)
        }
    }
}