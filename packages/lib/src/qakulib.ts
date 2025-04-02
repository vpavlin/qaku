import { Codex } from "@codex-storage/sdk-js";
import { destroyDispatcher, Dispatcher, DispatchMetadata, Signer} from "waku-dispatcher"
import { AnsweredMessage, ControlMessage, EnhancedQuestionMessage, LocalPoll, MessageType, ModerationMessage, NewPoll, Poll, PollActive, PollVote, QakuEvents, QakuState, QuestionList, QuestionMessage, QuestionShow, QuestionSort, UpvoteMessage } from "./types.js";
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


export class Qaku extends EventEmitter {
    codexURL:string = "" 

    state:QakuState = QakuState.UNDEFINED

    node:LightNode | undefined = undefined
    dispatcher:Dispatcher | null = null
    controlState:ControlMessage | undefined = undefined
    identity:Identity | undefined = undefined

    questions:QuestionList = new Map<string, EnhancedQuestionMessage>()
    polls:LocalPoll[] = []

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
        await this.dispatcher?.stop()

        const s = new Store(`qaku-${id}`)        
        const disp = new Dispatcher(this.node as any, "", false, s)
        if (!disp) {
            throw new Error("Failed to init QA: dispatcher recreation failed")
        }

        this.dispatcher = disp

        await this.dispatcher.initContentTopic(CONTENT_TOPIC_MAIN(id))

        if (password) {
            this.dispatcher.registerKey(utf8ToBytes(sha256(password)).slice(0, 32), 0, true)
        }
        console.debug(MessageType.CONTROL_MESSAGE)
        this.dispatcher.on(MessageType.CONTROL_MESSAGE, this.handleControlMessage.bind(this), true, this.dispatcher.autoEncrypt)
        console.debug(MessageType.QUESTION_MESSAGE)
        this.dispatcher.on(MessageType.QUESTION_MESSAGE, this.handleNewQuestion.bind(this), false, this.dispatcher.autoEncrypt)
        console.debug(MessageType.UPVOTE_MESSAGE)
        this.dispatcher.on(MessageType.UPVOTE_MESSAGE, this.handleUpvote.bind(this), true, this.dispatcher.autoEncrypt)
        console.debug(MessageType.ANSWERED_MESSAGE)
        this.dispatcher.on(MessageType.ANSWERED_MESSAGE, this.handleAnsweredMessage.bind(this), true, this.dispatcher.autoEncrypt)
        console.debug(MessageType.MODERATION_MESSAGE)
        this.dispatcher.on(MessageType.MODERATION_MESSAGE, this.handleModerationMessage.bind(this), true, this.dispatcher.autoEncrypt)

        this.dispatcher.on(MessageType.POLL_CREATE_MESSAGE, this.handlePollCreateMessage.bind(this), true, this.dispatcher.autoEncrypt)
        this.dispatcher.on(MessageType.POLL_VOTE_MESSAGE, this.handlePollVoteMessage.bind(this), true, this.dispatcher.autoEncrypt)
        this.dispatcher.on(MessageType.POLL_ACTIVE_MESSAGE, this.handlePollActiveMessage.bind(this), true, this.dispatcher.autoEncrypt)
        await this.dispatcher.start()
        try {
            await this.node!.waitForPeers([Protocols.Store]);

            console.log("Dispatching local query")
            await this.dispatcher.dispatchLocalQuery() 

            console.log(this.questions)

            if (this.questions.size == 0) {
                console.log("Dispatching general query")
                await this.dispatcher.dispatchQuery()
                console.log(this.questions)
            }

            this.emit(QakuEvents.QAKU_STATE_UPDATE, QakuState.INIT_PROTOCOL)
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
        if (this.controlState != undefined && this.controlState.owner != signer) throw new Error("control message: owner changed")
        if (this.controlState != undefined && this.controlState.updated > payload.updated) throw new Error("control message: too old") //might need to come up with some merging strategy as this basically ignores updates which come out of order
        console.debug("Setting Control State")
        this.controlState = payload
        this.emit(QakuEvents.NEW_CONTROL_MESSAGE, this.controlState.id)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, undefined)

    }

    private handleNewQuestion(payload: QuestionMessage, signer: Signer, meta:DispatchMetadata): void {
        if (!this.controlState?.enabled) {
            throw new Error("new question: Q&A closed")
        }

        if (!payload.question || payload.question.length == 0) throw new Error("new question: question empty")

        const hash = sha256(JSON.stringify(payload))
        if (this.questions.has(hash)) {
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
        this.questions.set(hash, q) 
        this.emit(QakuEvents.NEW_QUESTION, hash)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, undefined)
    }

    private handleUpvote (payload: AnsweredMessage, signer: Signer): void {
        if (!signer) throw new Error("upvote: not signed")
        if (!this.controlState?.enabled) throw Error("upvote: Q&A closed")

        const q =  this.questions.get(payload.hash)
        if (!q) throw new Error("upvote: unknown question")

        if ((q.upvotedByMe && signer == this.identity!.address()) || q.upvoters.includes(signer)) throw new Error("upvote: already voted")
        if (q.answered) throw new Error("upvote: already answered")
        if (q.moderated) throw new Error("upvote: moderated")

        q.upvotes++

        if (signer === this.identity!.address()) {
            q.upvotedByMe = true
        }
        q.upvoters.push(signer)

        this.questions.set(payload.hash, q)
        this.emit(QakuEvents.NEW_UPVOTE, payload.hash)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, undefined)
    }

    private handleAnsweredMessage (payload: AnsweredMessage, signer: Signer): void {
        if (!signer) throw new Error("answer: not signed")

        if (this.controlState?.owner != signer && !this.controlState?.admins.includes(signer)) throw new Error("answer: unauthorized to answer")

        const q = this.questions.get(payload.hash)
        if (!q) throw new Error("answer: unknown question")


        if (q.answered) throw new Error("answer: already answered")
        q.answered = true
        q.answer = payload.text
        q.answeredBy = signer

        this.questions.set(payload.hash, q)
        this.emit(QakuEvents.NEW_ANSWER, payload.hash)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, undefined)
    }

    private handleModerationMessage (payload: ModerationMessage, signer: Signer): void {
        if (!signer) throw new Error("moderate: not signed")

        if (this.controlState?.owner != signer && !this.controlState?.admins.includes(signer)) throw new Error("moderate: unauthorized to answer")

        const q = this.questions.get(payload.hash)
        if (!q) throw new Error("answer: unknown question")


        q.moderated = payload.moderated

        this.questions.set(payload.hash, q)
        this.emit(QakuEvents.NEW_MODERATION, payload.hash)
        this.emit(QakuEvents.QAKU_CONTENT_CHANGED, undefined)
    }

    private handlePollCreateMessage(payload: NewPoll, signer: Signer) {
        if (!signer) throw new Error("poll: not signed")

        if (this.controlState?.owner != signer && !this.controlState?.admins.includes(signer) || signer != payload.creator) {
            throw new Error("poll: unauthorized to create")
        }

        const poll:LocalPoll = {...payload.poll, owner: signer}
        
        if (this.polls.find((p:LocalPoll) => p.id == poll.id)) throw new Error("poll: already exists")

        this.polls.push(poll)

        this.emit(QakuEvents.NEW_POLL, poll.id)
    }

    private handlePollVoteMessage(payload: PollVote, signer: Signer) {
        if (!signer) throw new Error("poll vote: not signed")

        const poll = this.polls.find((p) => p.id == payload.id)
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

        this.emit(QakuEvents.NEW_POLL_VOTE, poll.id)
    }

    private handlePollActiveMessage(payload: PollActive, signer: Signer) {
        if (!signer) throw new Error("poll active: not signed")

        if (this.controlState?.owner != signer && !this.controlState?.admins.includes(signer)) {
            throw new Error("poll active: unauthorized")
        }

        const poll = this.polls.find((p) => p.id == payload.id)
        if (!poll) throw new Error("poll vote: unknown poll")
        poll.active = payload.active

        this.emit(QakuEvents.POLL_STATE_CHANGE, poll.id)
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

        await destroyDispatcher()



        await this.initQA(hash, password)

        const contentTopic = CONTENT_TOPIC_MAIN(hash)
        const pubsubTopics = this.node.connectionManager.pubsubTopics
        const shardInfo = pubsubTopicsToShardInfo(pubsubTopics)
        const shardIndex = contentTopicToShardIndex(contentTopic, shardInfo.shards.length)
        //dispatcher.on(MessageType.CONTROL_MESSAGE, () => {})
        const encoder = createEncoder({ contentTopic: contentTopic, ephemeral: false, pubsubTopicShardInfo: {clusterId: shardInfo.clusterId, shard: shardIndex} })
        const result = await this.dispatcher!.emitTo(encoder, MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet(), key, true)
        console.debug(result)
        if (result) {
            return hash
        } else {
            console.error("Failed to create the Q&A", result)
            throw new Error(result)
        }

        return ""
    }

    public async switchQAState(newState:boolean) {
        if (!this.controlState) {
            throw new Error("Q&A not initialized")
        }
        const cmsg:ControlMessage = {
            title: this.controlState.title,
            description: this.controlState.description,
            id: this.controlState.id,
            enabled: newState,
            timestamp: this.controlState.timestamp,
            updated: Date.now(),
            owner: this.controlState.owner,
            admins: this.controlState.admins,
            moderation: this.controlState.moderation
        }
        
        this.dispatcher!.emit(MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet())
    }

    public async removeAdmin(admin:string) {
        if (!this.controlState) {
            throw new Error("Q&A not initialized")
        }

        const newAdmins = this.controlState.admins.filter((a:string) => a != admin)

        const cmsg:ControlMessage = {
            title: this.controlState.title,
            description: this.controlState.description,
            id: this.controlState.id,
            enabled: this.controlState.enabled,
            timestamp: this.controlState.timestamp,
            updated: Date.now(),
            owner: this.controlState.owner,
            admins: newAdmins,
            moderation: this.controlState.moderation
        }
        
        this.dispatcher!.emit(MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet())
    }

    public async setAdmins(admins:string[]) {
        if (!this.controlState) {
            throw new Error("Q&A not initialized")
        }

        const cmsg:ControlMessage = {
            title: this.controlState.title,
            description: this.controlState.description,
            id: this.controlState.id,
            enabled: this.controlState.enabled,
            timestamp: this.controlState.timestamp,
            updated: Date.now(),
            owner: this.controlState.owner,
            admins: admins,
            moderation: this.controlState.moderation
        }
        
        this.dispatcher!.emit(MessageType.CONTROL_MESSAGE, cmsg, this.identity!.getWallet())
    }
    

    public async newQuestion(question:string):Promise<string | undefined> {
        const qmsg:QuestionMessage = {question: question, timestamp: new Date()}
        const result = await this.dispatcher!.emit(MessageType.QUESTION_MESSAGE, qmsg)
        if (result) {
            this.emit(QakuEvents.NEW_QUESTION_PUBLISHED, this.controlState!.id, this.identity!.getWallet())
            return questionHash(qmsg)
        }  

        console.error("Failed to publish a question")
        return undefined
    }

    public async upvote(questionHash:string):Promise<boolean> {
        const amsg:UpvoteMessage = {hash: questionHash}
        const result = await this.dispatcher!.emit(MessageType.UPVOTE_MESSAGE, amsg, this.identity!.getWallet())

        if (result) {
            this.emit(QakuEvents.NEW_UPVOTE_PUBLISHED, questionHash)
            return true
        }

        console.error("Failed to upvote the question", questionHash)
        return false
    }

    public async answer(questionHash:string, answer?:string):Promise<boolean> {
        const amsg:AnsweredMessage = { hash: questionHash, text: answer }
        const result = await this.dispatcher!.emit(MessageType.ANSWERED_MESSAGE, amsg, this.identity!.getWallet())

        if (result) {
            this.emit(QakuEvents.NEW_ANSWER_PUBLISHED, questionHash)
            return true
        }

        console.error("Failed to publish answer for the question", questionHash)
        return false
    }

    public async moderate(questionHash:string, moderated:boolean):Promise<boolean> {
        const mmsg:ModerationMessage = { hash: questionHash, moderated: moderated }
        const result = await this.dispatcher!.emit(MessageType.MODERATION_MESSAGE, mmsg, this.identity!.getWallet())

        if (result) {
            this.emit(QakuEvents.NEW_MODERATION_PUBLISHED, questionHash)
            return true
        }
        console.error("Failed to moderate the message", questionHash)
        return false
    }

    public async newPoll(poll: Poll):Promise<boolean> {
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

        const result = await this.dispatcher!.emit(MessageType.POLL_CREATE_MESSAGE, newPoll, this.identity!.getWallet())
        if (result) {
            this.emit(QakuEvents.NEW_POLL_PUBLISHED, newPoll.poll.id)
            return true
        }
        console.error("Failed to create a new poll", poll)
        return false
    }

    public async pollVote(pollId: string, option: number):Promise<boolean> {
        const res = await this.dispatcher!.emit(MessageType.POLL_VOTE_MESSAGE, {id: pollId, option: option} as PollVote, this.identity!.getWallet())

        if (!res) {
            console.error("Failed to vote on poll", pollId, option)
            return false
        }

        return true
    }

    public async pollActive(pollId: string, newState: boolean):Promise<boolean> {
        const res = await this.dispatcher!.emit(MessageType.POLL_ACTIVE_MESSAGE, {id: pollId, active: newState} as PollActive, this.identity!.getWallet())
        if (!res) {
            console.error("Failed to set poll active state", pollId, newState)  
            return false
        }
        return true
    }

    public getQuestions(sortBy:QuestionSort[], show:QuestionShow[] = [QuestionShow.ALL]) {
        let q = Array.from(this.questions.values())
        
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

    public async destroy() {
        await destroyDispatcher()
        this.controlState = undefined
        this.questions = new Map<string, EnhancedQuestionMessage>()
        this.polls = []
        this.state = QakuState.UNDEFINED
        this.dispatcher = null
        this.identity = undefined
        this.node = undefined
    }
}