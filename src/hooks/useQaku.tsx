import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityMessage, AnsweredMessage, ControlMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, DownloadSnapshot, UpvoteMessage, replacer, reviver, unique, qaHash } from "../utils/messages";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, CONTENT_TOPIC_ACTIVITY, CONTENT_TOPIC_MAIN, CONTENT_TOPIC_PERSIST, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL, DEFAULT_PUBLISH_INTERVAL } from "../constants";
import { useWakuContext } from "./useWaku";
import { Codex, CodexData } from "@codex-storage/sdk-js";
import { getStoredSnapshotInfo, PersistentSnapshot, setStoredSnapshotInfo, Snapshot } from "../utils/snapshots";
import {HistoryTypes, HistoryEntry, LocalPoll, Qaku, QakuEvents, QakuState, QuestionSort, History, HistoryEvents, Id} from "qakulib"

export type QakuInfo = {
    qaku:Qaku | undefined;
    controlState: ControlMessage | undefined;
    isOwner: boolean;
    isAdmin: boolean;
    active: number;
    visited: HistoryEntry[]
    polls: LocalPoll[]
    history: HistoryEntry[]
    admin: HistoryEntry[]
    participated: HistoryEntry[]
    localQuestions: EnhancedQuestionMessage[]
    loading: boolean
    codexAvailable: boolean;
    ready: boolean;
}

export type QakuContextData = {
    providerInfo: QakuInfo;
} | null;

export const QakuContext = React.createContext<QakuContextData>(null);

export const useQakuContext = () => {
    const qakuContext = useContext(QakuContext);

    if (!qakuContext) {
        throw new Error("QakuContext at a wrong level")
    }
    const { providerInfo } = qakuContext;
    return useMemo<QakuInfo>(() => {
        return {...providerInfo}
    }, [qakuContext])
}

interface Props {
    id: string | undefined;
    password: string | undefined;
    updateStatus: (msg:string, typ:string, delay?:number) => void;
    children: React.ReactNode;
}

const sorting = [QuestionSort.ANSWERED_ASC,QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC]


export const QakuContextProvider = ({ id, password, updateStatus, children }: Props) => {
    console.log("This is current ID: ", id)

    const { node } = useWakuContext()
    const [ qaku, setQaku ] = useState<Qaku>()
    const [ historyService, setHistoryService ] = useState<History>()
    const [ lastId, setLastId ] = useState<string>()
    const [ controlState, _setControlState ] = useState<ControlMessage>()
    const controlStateRef = useRef(controlState)
    const setControlState = (cmsg: ControlMessage | undefined) => {
        controlStateRef.current = cmsg
        _setControlState(cmsg)
    }

    const [ protocolInitialized, setProtocolInitialized] = useState(false)
    const [ isOwner, setOwner ] = useState<boolean>(false)
    const [ isAdmin, setAdmin ] = useState<boolean>(false)

    const [ active, setActive ] = useState<number>(0)
    const [ activeList, setActiveList ] = useState<ActivityMessage[]>([])

    const [ history, setHistory ] = useState<HistoryEntry[]>([])
    const [ visited, setVisited ] = useState<HistoryEntry[]>([])
    const [ participated, setParticipated ] = useState<HistoryEntry[]>([])
    const [ admin, setAdminHistory ] = useState<HistoryEntry[]>([])


    const [questions, setQuestions] = useState<Map<string, EnhancedQuestionMessage>>(new Map<string, EnhancedQuestionMessage>())
    const [localQuestions, setLocalQuestions] = useState<EnhancedQuestionMessage[]>([])

    //const { wallet, storePrivateKey } = useIdentity("qaku-key-v2", "qaku-wallet")

    const [polls, setPolls] = useState<LocalPoll[]>([])

    const [ loading, setLoading ] = useState<boolean>(false)

    const [ snapshot, setSnapshot ] = useState<Snapshot>()
    const [ regularSnapshotInterval, setRegularSnapshotInterval] = useState<NodeJS.Timer>()

    const [processingSnapshot, setProcessingSnapshot] = useState<string>()

    const codexURL = localStorage.getItem(CODEX_URL_STORAGE_KEY) || DEFAULT_CODEX_URL
    const publicCodexURL = localStorage.getItem(CODEX_PUBLIC_URL_STORAGE_KEY) || DEFAULT_PUBLIC_CODEX_URL

    const [codexAvailable, setCodexAvailable] = useState(false)
    const [ codexCheckInterval, setCodexCheckInterval] = useState<NodeJS.Timer>()


   /* const importPrivateKey = async (result: string) => {
        const parsed = JSON.parse(result)
        storePrivateKey(parsed.key)

        if (parsed.history)
            setHistory(parsed.history)
        
        window.location.reload()

    }*/

    /*const doSnapshot = ():DownloadSnapshot | undefined => {
        if (!controlState || localQuestions.length == 0 || !wallet) return

        const snap = {
            metadata: controlState,
            polls: polls,
            questions: localQuestions,
            signature: ""
        }

        const sig = wallet.signMessageSync(JSON.stringify(snap))

        snap.signature = sig
       
        return snap
    }*/


   /* const publishSnapshot = async () => {
        if (!qaku || !wallet || !id) return 

        const encoder = createEncoder({contentTopic: CONTENT_TOPIC_PERSIST, ephemeral: true, pubsubTopicShardInfo: {clusterId: 42, shard: 0}})
        const snap = await dispatcher.getLocalMessages()

        if (!snap) {
            console.error("Failed to get snapshot")
            return
        }

        const codex = new Codex(codexURL);

        try {
            const cache = new QakuCache(publicCodexURL)
            const infoResp = await cache.info()
            if (infoResp.error) {
                console.error("Failed to get a public cache Codex node info")
            }   

            const data = await (infoResp.data as Response).json()
            const res = await codex.node.connect(data.peerId, [data.addr])
            if (res.error) {
                console.error(res.data)
            }
        } catch (e) {
            console.error(e)
        }

        try {
            const serialized = JSON.stringify(snap)
            const hash = sha256(serialized)

            const toPersist: PersistentSnapshot = {hash: hash, owner: wallet.address, messages: snap}
            console.log(toPersist)

            const storedSnap = getStoredSnapshotInfo(id)

            //let cid = storedSnap?.cid
            const timestamp = Date.now()
            //console.log(cid)
            
            const res = await codex.data.upload(JSON.stringify(toPersist), undefined, {filename: hash, mimetype: "application/json"}).result
            console.log(res)
            if (res.error) {
                console.error("Failed to upload to Codex:", res.data)
                updateStatus("Failed to upload snapshot to Codex", "error")
                return
            }
            
            const cid = res.data as string
            console.log(cid)
            const smsg: Snapshot = {hash: hash, cid: cid, timestamp: timestamp}
            console.log(smsg)
            const result = await qaku.dispatcher!.emitTo(encoder, MessageType.PERSIST_SNAPSHOT, smsg, wallet, false)
            if (!result) {
                console.error("Failed to publish")
            }
            
            const toStore:Snapshot = {cid: cid!, hash: hash, timestamp: timestamp} 
            const result2 =  await qaku.dispatcher!.emit(MessageType.SNAPSHOT, toStore as Snapshot, wallet)
            if (!result2) {
                console.error("Failed to publish snapshot")
                updateStatus("Failed to publish a snapsthot", "error")
                return
            }

            updateStatus("Published snapshot with CID \n" + cid, "info", 5000)
            setStoredSnapshotInfo(id, toStore)
        } catch(e) {
            console.error(e)
            updateStatus("Failed to publish a snapsthot", "error")
            return
        }

    }

    const importFromSnapshot = async (cid:string):Promise<boolean> => {
        if (!qaku || !id) return false
        let codex: CodexData | QakuCache | undefined = undefined
        
        codex = new Codex(codexURL).data;
        const spaceResp = await codex.space()
        if (spaceResp.error) {
           codex = new QakuCache(publicCodexURL)
        }
        
        
        let response: Response | null = null
        let persisted:PersistentSnapshot | null = null
        for (let i=0;i < 5;i++) {
            try {
                const data = await codex.networkDownloadStream(cid)
                if (data.error) {
                    console.error(data.data)
                    await sleep((i+1)*2000)
                    continue
                }
                response = data.data as Response
                persisted = await response.json()
            } catch(e) {
                await sleep((i+1)*2000)
                continue
            }
            break;
        }

        if (!response) {
            updateStatus("Failed to get a snapshot", "error")
            console.error("failed to get a snapshot")
            return false
        }
         
        if(!persisted || !persisted.messages || persisted.messages.length == 0) return false

        setProcessingSnapshot(persisted.hash)

        const [dmsg, encrypted] = await qaku.dispatcher!.decryptMessage(persisted.messages[0].dmsg.payload)

        if (qaku.dispatcher!.autoEncrypt != encrypted) {
            console.error("expected ", encrypted ? "encrypted" :"plain", "message")
            setProcessingSnapshot(undefined)
            return false
        }

        if (dmsg.type != MessageType.CONTROL_MESSAGE) {
            console.error("expeced CONTROL_MESSAGE, got", dmsg.type)
            setProcessingSnapshot(undefined)
            return false
        }

        if (dmsg.signer != persisted.owner) {
            console.error("unexpected signer ", dmsg.signer, "!=", persisted.owner)
            setProcessingSnapshot(undefined)
            return false
        }
        const cmsg:ControlMessage = dmsg.payload
        const testId = qaHash(cmsg.title, cmsg.timestamp, cmsg.owner)
        const pureId = id?.startsWith('X') ? id.slice(1) : id

        if (testId != cmsg.id || testId != pureId) {
            console.error("unexpected QA id", testId)
            setProcessingSnapshot(undefined)
            return false
        }

        
        console.log(processingSnapshot)
        console.log(persisted)

        if (processingSnapshot && processingSnapshot == persisted.hash) {
            return false
        }
        updateStatus("Importing snapshot", "info", 2000)

        try {
            await qaku.dispatcher!.importLocalMessage(persisted.messages)
            console.debug("imported, dispatching local query")
            updateStatus("Successfully imported messaged from snapshot", "success", 3000)
        } catch (e) {
            console.error(e)
            setProcessingSnapshot(undefined)
            return false

        }

        //console.debug("about to dispatch local query")
        qaku.dispatcher!.clearDuplicateCache()
        await qaku.dispatcher!.dispatchLocalQuery()
        //console.debug("done with local query")

        setProcessingSnapshot(undefined)

        return true
    
    }*/

    const checkCodexAvailable = async () => {
        const codex = new Codex(codexURL);
        const res = await codex.debug.info()
        if (res.error) {
            setCodexAvailable(false)
            return
        }
        if (res.data.table.nodes.length < 5) {
            setCodexAvailable(false)
            return
        }

        setCodexAvailable(true)
    }

    useEffect(() => {
        console.log(qaku)
        if (!node || qaku) return
        (async () => {
            updateStatus("Loading Qaku", "info", 2000)

            const q = new Qaku(node as any) //FIXME
            setHistoryService(q.history)

            await q.init()
            console.log("Qaku is ready")
            setQaku(q)
        })()

    }, [node, qaku])

    useEffect(() => {
        if (!qaku || !id || !node || (id && id.startsWith("X") && !password)) return;
   
        const updateQuestions = (qid: Id) => {
            console.log("update questions", qid, id)
            if (qid != id) return
            const questions = qaku.getQuestions(qid, sorting)
            console.log(questions)
            setLocalQuestions(questions)
        } 

        const updateControlState = (qid: Id) => {
            if (qid != id) return
            const qa = qaku.qas.get(qid)
            if (!qa) {
                console.error("QA not found")
                return
            }
            console.log(qa.controlState, qid, id)
            console.log("setting control state")
            setControlState(qa.controlState)
            setProtocolInitialized(true)
            
        }

        const updatePolls = (qid: Id) => {
            if (qid != id) return
            const polls = qaku.getPolls(id)
            setPolls([...polls])
        }

        (async () => {
            setLoading(true)

            let qa = qaku.qas.get(id)
            if (!qa || !protocolInitialized) {
               /* qaku.on(QakuEvents.QAKU_STATE_UPDATE, ((state: string, qid: Id) => {
                    if (state == QakuState.INIT_PROTOCOL && qid == id) {
                        setProtocolInitialized(true)
                    }
                }).bind(id))*/
                qaku.on(QakuEvents.NEW_QUESTION, updateQuestions.bind(id))
                qaku.on(QakuEvents.NEW_ANSWER, updateQuestions.bind(id))
                qaku.on(QakuEvents.NEW_MODERATION, updateQuestions.bind(id))
                qaku.on(QakuEvents.NEW_UPVOTE, updateQuestions.bind(id))
                qaku.on(QakuEvents.NEW_CONTROL_MESSAGE, updateControlState.bind(id))
    
                qaku.on(QakuEvents.NEW_POLL, updatePolls.bind(id))
                qaku.on(QakuEvents.NEW_POLL_VOTE, updatePolls.bind(id))
                qaku.on(QakuEvents.POLL_STATE_CHANGE, updatePolls.bind(id))

                await qaku.initQA(id, password)
                qa = qaku.qas.get(id)
            }

            if (!qa) {
                updateStatus("Failed to find QA", "error", 2000)
                return
            }   
            
            if (qa.controlState && qa.controlState.id == id) {
                console.log("Setting control state in useQaku", qa.controlState)
                setControlState(qa.controlState)
                setProtocolInitialized(true)
            }
            if (lastId == undefined) {
                setLastId(id)
            }
            updateStatus("Qaku initialized", "info", 2000)
            setLoading(false)
        
        
            //checkCodexAvailable()
            //setCodexCheckInterval(setInterval(checkCodexAvailable, 3000))
         
            setLoading(false)
        })()

        return () => {
            clearInterval(codexCheckInterval)
        }
    }, [id, qaku, password, protocolInitialized])

    useEffect(() => {
        if (!qaku) return

        (async () => {
            const qas = qaku.history.getAll().filter(qa => qa.type == HistoryTypes.CREATED || qa.type == HistoryTypes.ADMIN)
            for (const qa of qas) {
                if (!qa.isActive) continue

               await qaku.initQA(qa.id, qa.password).then((res) => console.log("QA initialized: ", id))
            }
        })()

    }, [qaku])

    useEffect(() => {
        if (!controlState || !id || !qaku) return
        console.log("Loading")

        const questions = qaku.getQuestions(id, sorting)
        setLocalQuestions(questions)

        const polls = qaku.getPolls(id)
        setPolls(polls)
    }, [controlState])
    /*useEffect(() => {
        if (!qaku || !wallet || !id || !controlState) return

        if (wallet.address != controlState.owner) return

        const snap = getStoredSnapshotInfo(id)

        if (!snap || snap.timestamp+DEFAULT_PUBLISH_INTERVAL < Date.now()) {
            console.log("Publishing snapshot")
            console.log(snap)
            publishSnapshot()
        } else {
            console.log("no need to publish")
        }

        setRegularSnapshotInterval(setInterval(publishSnapshot, DEFAULT_PUBLISH_INTERVAL))

        return () => {
            clearInterval(regularSnapshotInterval)
        }
    }, [qaku, wallet, id, controlState])*/

    useEffect(() => {
        console.log("LastID vs. new ID", lastId, id)
        if (lastId != undefined && id != lastId) {
            console.log("Destroying everything!")

            //setQaku(undefined)
            clearInterval(codexCheckInterval)
            clearInterval(regularSnapshotInterval)
            
            //setControlState(undefined)
 
            //setQuestions(new Map<string, EnhancedQuestionMessage>())
            
            //setPolls([])
            //setLocalQuestions([])
            //await qaku?.destroy() //FIXME: Will this work?
            //setHistoryService(undefined)
            console.log("Destroyed everything!")
            if (!qaku || !id) return

            if (!qaku.qas.get(id)) {
                setControlState(undefined)
                setQuestions(new Map<string, EnhancedQuestionMessage>())
                setPolls([])
                setLocalQuestions([])
                return
            } else {
                const sorting = [QuestionSort.ANSWERED_ASC,QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC]
                const questions = qaku.getQuestions(id, sorting)
                console.log(questions)
                setLocalQuestions(questions)

                const polls = qaku.getPolls(id)
                setPolls([...polls])
            }
        }

        if (lastId != undefined && id == undefined) {
            setControlState(undefined)
            setPolls([])
            setLocalQuestions([])
        }

        setLastId(id)
        setOwner(false)
        setAdmin(false)
        setSnapshot(undefined)
        setProtocolInitialized(false)

    }, [id])

    useEffect(() => {
        if (!historyService) return

        const loadHistory = () => {
            setHistory(historyService.getAll(HistoryTypes.CREATED))
            setVisited(historyService.getAll(HistoryTypes.VISITED))
            setParticipated(historyService.getAll(HistoryTypes.PARTICIPATED))
            setAdminHistory(historyService.getAll(HistoryTypes.ADMIN))
        }

        historyService.on(HistoryEvents.STORED, loadHistory)

        loadHistory()

        
    }, [historyService])

    useEffect(() => {
        if (!controlState || !qaku || !id) return

        setOwner(controlState.owner == qaku.identity!.address())
        setAdmin(controlState.admins.includes(qaku.identity!.address()))
    }, [controlState, qaku])

    useEffect(() => {
        if (!activeList) return
        setActive(activeList.length)
    }, [activeList])

    /*useEffect(() => {
        if (!qaku || !snapshot || !id) return

        (async () => {
            try {
                console.log(snapshot)
                if (await importFromSnapshot(snapshot.cid)) {
                    setStoredSnapshotInfo(id, snapshot)
                }
            } catch (e) {
                console.error(e)
            }
        })()


    }, [qaku, snapshot, id])*/

    const qakuInfo = useMemo(
        () => ({
            qaku,
            controlState,
            isOwner,
            isAdmin,
            visited,
            localQuestions,
            active,
            polls,
            history,
            participated,
            admin,
            loading,
            codexAvailable,
            ready: protocolInitialized,
        }),
        [
            qaku,
            controlState,
            isOwner,
            isAdmin,
            visited,
            localQuestions,
            active,
            polls,
            history,
            participated,
            admin,
            loading,
            codexAvailable,
            protocolInitialized,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}