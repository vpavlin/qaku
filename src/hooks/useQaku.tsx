import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityMessage, AnsweredMessage, ControlMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, DownloadSnapshot, UpvoteMessage, replacer, reviver, unique, qaHash } from "../utils/messages";
import { DecodedMessage, bytesToUtf8, createDecoder, createEncoder, utf8ToBytes } from "@waku/sdk";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, CONTENT_TOPIC_ACTIVITY, CONTENT_TOPIC_MAIN, CONTENT_TOPIC_PERSIST, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL, DEFAULT_PUBLISH_INTERVAL } from "../constants";
import { sha256 } from "js-sha256";
import { Wallet } from "ethers";
import useIdentity from "./useIdentity";
import { LocalPoll, NewPoll, Poll, PollActive, PollVote } from "../components/polls/types";
import { useWakuContext } from "./useWaku";
import { Codex, CodexData } from "@codex-storage/sdk-js";
import { getStoredSnapshotInfo, PersistentSnapshot, setStoredSnapshotInfo, Snapshot } from "../utils/snapshots";
import { QakuCache } from "../utils/cache";
import { sleep } from "../utils/utils";
import {Qaku, QakuEvents, QakuState, QuestionSort} from "qakulib"

export type HistoryEntry = {
    id: string;
    title: string;
}

export type QakuInfo = {
    qaku:Qaku | undefined;
    controlState: ControlMessage | undefined;
    isOwner: boolean;
    isAdmin: boolean;
    active: number;
    visited: HistoryEntry[]
    polls: LocalPoll[]
    historyAdd: (id: string, title: string) => void
    getHistory: () => HistoryEntry[]
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


export const QakuContextProvider = ({ id, password, updateStatus, children }: Props) => {
    console.log("This is current ID: ", id)

    const { node } = useWakuContext()
    const [ qaku, setQaku ] = useState<Qaku>()
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


    const historyAdd = (id: string, title: string) => {
        setHistory((h) => [...h, {id: id, title: title}])
    }

    const getHistory = (): HistoryEntry[] => {
        return history
    }
   
    const callback_activity = (msg: DecodedMessage) => {
        const decoded:ActivityMessage = JSON.parse(bytesToUtf8(msg.payload))
        return decoded
    }

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
            q.on(QakuEvents.QAKU_STATE_UPDATE, (msg) => {
                if (msg == QakuState.INIT_PROTOCOL) {
                    setProtocolInitialized(true)
                }
                updateStatus(msg, "info", 2000)
            })
            const sorting = [QuestionSort.ANSWERED_ASC,QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC]
            q.on(QakuEvents.NEW_QUESTION, () => {
                const questions = q.getQuestions(sorting)
                console.log(questions)
                setLocalQuestions(questions)
            })

            q.on(QakuEvents.NEW_ANSWER, () => {
                const questions = q.getQuestions(sorting)
                console.log(questions)
                setLocalQuestions(questions)
            })
            q.on(QakuEvents.NEW_MODERATION, () => {
                const questions = q.getQuestions(sorting)
                console.log(questions)
                setLocalQuestions(questions)
            })
            q.on(QakuEvents.NEW_UPVOTE, () => {
                const questions = q.getQuestions(sorting)
                console.log(questions)
                setLocalQuestions(questions)
            })
            q.on(QakuEvents.NEW_CONTROL_MESSAGE, ((qid:string) => {
                console.log(q.controlState, qid, id)
                if (qid == id) {
                    console.log("setting control state")
                    setControlState(q.controlState)
                }
            }).bind(id))

            await q.init()
            console.log("Qaku is ready")
            setQaku(q)
        })()

    }, [node, qaku])

    useEffect(() => {
        if (!qaku || !id || !node || (id && id.startsWith("X") && !password)) return;
   

        (async () => {
            setLoading(true)

            console.log(qaku.controlState?.id, id, password)
            if (!protocolInitialized) {
                qaku.initQA(id, password)
            }
            
            if (qaku.controlState && qaku.controlState.id == id) {
                console.log("Setting control state in useQaku", qaku.controlState)
                setControlState(qaku.controlState)
            }
            if (lastId == undefined) {
                setLastId(id    )
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
    }, [id, qaku, password])

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
            (async () =>{
                console.log("Destroying everything!")
                clearInterval(codexCheckInterval)
                clearInterval(regularSnapshotInterval)
                setLastId(id)
                setControlState(undefined)
                setOwner(false)
                setAdmin(false)
                setQuestions(new Map<string, EnhancedQuestionMessage>())
                setActive(1)
                setSnapshot(undefined)
                setPolls([])
                await qaku?.destroy() //FIXME: Will this work?
                setProtocolInitialized(false)
                setQaku(undefined)
                console.log("Destroyed everything!")

            })()
        }
    }, [id])

    useEffect(() => {
        let h = localStorage.getItem("qaku-history")
        if (h) {
            setHistory(JSON.parse(h))
        }

        let v = localStorage.getItem("qaku-visited")
        if (v) {
            setVisited(JSON.parse(v))
        }
    }, [])

    useEffect(() => {
        if (history.length > 0)  localStorage.setItem("qaku-history", JSON.stringify(history))
    }, [history])

    useEffect(() => {
        if (visited.length > 0)  localStorage.setItem("qaku-visited", JSON.stringify(visited))
    }, [visited])

    useEffect(() => {
        if (!controlState || !qaku || !id) return

        setVisited((v) => {
            if (password)
                id = id +"/"+password
            const exist = v.find((e) => e.id == id)
            if (!exist) return [...v, {id: id!, title: controlState.title}]

            return v
        })

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
            getHistory,
            historyAdd,
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
            getHistory,
            historyAdd,
            loading,
            codexAvailable,
            protocolInitialized,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}