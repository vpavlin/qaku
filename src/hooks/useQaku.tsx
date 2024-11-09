import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityMessage, AnsweredMessage, ControlMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, DownloadSnapshot, UpvoteMessage, replacer, reviver, unique, qaHash } from "../utils/messages";
import { DecodedMessage, bytesToUtf8, createDecoder, createEncoder, utf8ToBytes } from "@waku/sdk";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, CONTENT_TOPIC_ACTIVITY, CONTENT_TOPIC_MAIN, CONTENT_TOPIC_PERSIST, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL, DEFAULT_PUBLISH_INTERVAL } from "../constants";
import { sha256 } from "js-sha256";
import { Wallet } from "ethers";
import getDispatcher, { DispatchMetadata, Dispatcher, IDispatchMessage, Signer, destroyDispatcher } from "waku-dispatcher"
import useIdentity from "./useIdentity";
import { LocalPoll, NewPoll, Poll, PollActive, PollVote } from "../components/polls/types";
import { useWakuContext } from "./useWaku";
import { Codex, CodexData } from "@codex-storage/sdk-js";
import { getStoredSnapshotInfo, PersistentSnapshot, setStoredSnapshotInfo, Snapshot } from "../utils/snapshots";
import { QakuCache } from "../utils/cache";
import { sleep } from "../utils/utils";

export type HistoryEntry = {
    id: string;
    title: string;
}

export type QakuInfo = {
    controlState: ControlMessage | undefined;
    wallet: Wallet | undefined;
    isOwner: boolean;
    isAdmin: boolean;
    active: number;
    visited: HistoryEntry[]
    polls: LocalPoll[]
    historyAdd: (id: string, title: string) => void
    getHistory: () => HistoryEntry[]
    switchState: (newState: boolean) => void;
    importPrivateKey: (key: string) => void;
    localQuestions: EnhancedQuestionMessage[]
    dispatcher: Dispatcher | undefined;
    loading: boolean
    snapshot: () => DownloadSnapshot | undefined;
    publishSnapshot: () => void;
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
    const { node } = useWakuContext()
    const [ dispatcher, setDispatcher ] = useState<Dispatcher>()
    const [ lastId, setLastId ] = useState<string>()
    const [ controlState, _setControlState ] = useState<ControlMessage>()
    const controlStateRef = useRef(controlState)
    const setControlState = (cmsg: ControlMessage | undefined) => {
        controlStateRef.current = cmsg
        _setControlState(cmsg)
    }
    const [ isOwner, setOwner ] = useState<boolean>(false)
    const [ isAdmin, setAdmin ] = useState<boolean>(false)

    const [ active, setActive ] = useState<number>(0)
    const [ activeList, setActiveList ] = useState<ActivityMessage[]>([])

    const [ history, setHistory ] = useState<HistoryEntry[]>([])
    const [ visited, setVisited ] = useState<HistoryEntry[]>([])

    const [questions, setQuestions] = useState<Map<string, EnhancedQuestionMessage>>(new Map<string, EnhancedQuestionMessage>())
    const [localQuestions, setLocalQuestions] = useState<EnhancedQuestionMessage[]>([])

    const { wallet, storePrivateKey } = useIdentity("qaku-key-v2", "qaku-wallet")

    const [polls, setPolls] = useState<LocalPoll[]>([])

    const [ loading, setLoading ] = useState<boolean>(false)

    const [ snapshot, setSnapshot ] = useState<Snapshot>()
    const [ regularSnapshotInterval, setRegularSnapshotInterval] = useState<NodeJS.Timer>()

    const [processingSnapshot, setProcessingSnapshot] = useState<string>()

    const codexURL = localStorage.getItem(CODEX_URL_STORAGE_KEY) || DEFAULT_CODEX_URL
    const publicCodexURL = localStorage.getItem(CODEX_PUBLIC_URL_STORAGE_KEY) || DEFAULT_PUBLIC_CODEX_URL


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

    const switchState = (newState: boolean) => {
        if (!id || !controlState || !dispatcher || !wallet) return

        const cmsg:ControlMessage = {
            title: controlState.title,
            description: controlState.description,
            id: controlState.id,
            enabled: newState,
            timestamp: Date.now(),
            owner: controlState.owner,
            admins: controlState.admins,
            moderation: controlState.moderation
        }
        
        dispatcher.emit(MessageType.CONTROL_MESSAGE, cmsg, wallet)
    }

    const importPrivateKey = async (result: string) => {
        const parsed = JSON.parse(result)
        storePrivateKey(parsed.key)

        if (parsed.history)
            setHistory(parsed.history)
        
        window.location.reload()

    }

    const doSnapshot = ():DownloadSnapshot | undefined => {
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
    }


    const publishSnapshot = async () => {
        if (!dispatcher || !wallet || !id) return 

        const encoder = createEncoder({contentTopic: CONTENT_TOPIC_PERSIST, ephemeral: true})
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
            //console.log(toPersist)

            const storedSnap = getStoredSnapshotInfo(id)

            //let cid = storedSnap?.cid
            const timestamp = Date.now()
            //console.log(cid)
            
            const res = await codex.data.upload(JSON.stringify(toPersist)).result
            if (res.error) {
                console.error("Failed to upload to Codex:", res.data)
            }
            
            const cid = res.data as string
            console.log(cid)
            const smsg: Snapshot = {hash: hash, cid: cid, timestamp: timestamp}
            const result = await dispatcher.emitTo(encoder, MessageType.PERSIST_SNAPSHOT, smsg, wallet, false)
            if (!result) {
                console.error("Failed to publish")
            }
            
            const toStore:Snapshot = {cid: cid!, hash: hash, timestamp: timestamp} 
            const result2 =  await dispatcher.emit(MessageType.SNAPSHOT, toStore as Snapshot, wallet)
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
        if (!dispatcher || !id) return false
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

        const [dmsg, encrypted] = await dispatcher.decryptMessage(persisted.messages[0].dmsg.payload)

        if (dispatcher.autoEncrypt != encrypted) {
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
            await dispatcher.importLocalMessage(persisted.messages)
            console.debug("imported, dispatching local query")
            updateStatus("Successfully imported messaged from snapshot", "success", 3000)
        } catch (e) {
            console.error(e)
            setProcessingSnapshot(undefined)
            return false

        }

        //console.debug("about to dispatch local query")
        dispatcher.clearDuplicateCache()
        await dispatcher.dispatchLocalQuery()
        //console.debug("done with local query")

        setProcessingSnapshot(undefined)

        return true
    
    }

    useEffect(() => {
        if (dispatcher || !id || !node || (id && id.startsWith("X") && !password)) return;
   

        (async () => {
            updateStatus("Loading Dispatcher", "info", 2000)
            setLoading(true)
            let d: Dispatcher | null = null
            let retries = 0
            while(!d && retries < 10) {
                d = await getDispatcher(node, CONTENT_TOPIC_MAIN(id), "qaku-"+id, false, false)
                await new Promise((r) => setTimeout(r, 100))
                retries++
            }
            if (!d) {
                setLoading(false)
                return
            }
            if (password) {
                updateStatus("Setting encryption key", "info", 2000)
                d.registerKey(utf8ToBytes(sha256(password)).slice(0, 32), 0, true)
            }
                
            d.on(MessageType.CONTROL_MESSAGE, (payload: ControlMessage, signer: Signer, meta: DispatchMetadata) => {
                console.debug(payload)
                if (!payload.title) return
                if (!payload.description) payload.description = ""
                if (signer != payload.owner) return
                if (controlStateRef.current != undefined && controlStateRef.current.owner != signer) return
                setControlState(payload)
            }, true, d.autoEncrypt)
            d.on(MessageType.QUESTION_MESSAGE, (payload: QuestionMessage) => {
                if (!controlStateRef.current?.enabled) return
                setQuestions((lq) => {
                    const hash = sha256(JSON.stringify(payload))
                    if (lq.has(hash)) return lq
                    const q: EnhancedQuestionMessage = {
                        hash: hash,
                        question: payload.question,
                        timestamp: payload.timestamp,
                        moderated: false,
                        answer: undefined,
                        answered: false,
                        answeredBy: undefined,
                        upvotedByMe: false,
                        upvotes: 0,
                        upvoters: []
                    }
                    lq.set(hash, q)

                    return new Map(lq)
                })
            }, false, d.autoEncrypt)
            d.on(MessageType.UPVOTE_MESSAGE, (payload: UpvoteMessage, signer: Signer) => {
                if (!controlStateRef.current?.enabled || !signer) return

                setQuestions((lq) => {
                    const q =  lq.get(payload.hash)
                    if (!q) return lq
                    if ((q.upvotedByMe && signer == wallet?.address) || q.answered || q.moderated || q.upvoters.includes(signer)) return lq

                    q.upvotes++

                    if (signer === wallet?.address) {
                        q.upvotedByMe = true
                    }
                    q.upvoters.push(signer)

                    lq.set(payload.hash, q)

                    return new Map(lq)
                })
            }, true, d.autoEncrypt)
            d.on(MessageType.ANSWERED_MESSAGE, (payload: AnsweredMessage, signer: Signer) => {
                if (!signer || (controlStateRef.current?.owner != signer && !controlStateRef.current?.admins.includes(signer))) return
                setQuestions((lq) => {
                    const q =  lq.get(payload.hash)
                    if (!q) return lq
                    if (q.answered) return lq
                    q.answered = true
                    q.answer = payload.text
                    q.answeredBy = signer

                    lq.set(payload.hash, q)

                    return new Map(lq)
                })
            }, true, d.autoEncrypt)
            d.on(MessageType.MODERATION_MESSAGE, (payload: ModerationMessage, signer: Signer) => {
                if (!signer || (controlStateRef.current?.owner != signer && !controlStateRef.current?.admins.includes(signer))) return

                setQuestions((lq) => {
                    const q =  lq.get(payload.hash)
                    if (!q) return lq
                    q.moderated = payload.moderated

                    lq.set(payload.hash, q)

                    return new Map(lq)
                })
            }, true, d.autoEncrypt)
            d.on(MessageType.POLL_CREATE_MESSAGE, (payload: NewPoll, signer: Signer, meta: DispatchMetadata) => {
                if (!signer || (controlStateRef.current?.owner != signer && !controlStateRef.current?.admins.includes(signer)) || signer != payload.creator) {
                    console.log("Poll creator not owner %s != %s", signer, payload.creator)
                    return
                }

                const poll:LocalPoll = {...payload.poll, owner: signer}
    
                setPolls((x) => [poll, ...x.filter((p) => p.id !== payload.poll.id)])
            }, true, d.autoEncrypt)
            d.on(MessageType.POLL_VOTE_MESSAGE, (payload: PollVote, signer: Signer, meta: DispatchMetadata) => {
                setPolls((x) => {
                    const poll = x.find((p) => p.id == payload.id)
                    if (!poll) return x
                    if (!poll.active) return x

                    if (!poll.votes) poll.votes = [...poll.options.map(() => ({voters: []}))]
                    if (!poll.votes[payload.option].voters) poll.votes[payload.option].voters = []

                    if (poll.votes[payload.option].voters.indexOf(signer as string) < 0) {
                        poll.votes[payload.option].voters.push(signer as string)
                        if (!poll.voteCount) poll.voteCount = 0
                        poll.voteCount++
                    }

                    return [...x]
                })
            }, true, d.autoEncrypt)
            d.on(MessageType.POLL_ACTIVE_MESSAGE, (payload: PollActive, signer: Signer, meta: DispatchMetadata) => {
                if (!signer || (controlStateRef.current?.owner != signer && !controlStateRef.current?.admins.includes(signer))) {
                    return
                }
                setPolls((x) => {
                    const poll = x.find((p) => p.id == payload.id)
                    if (!poll) return x
                    if (poll.owner === signer || controlStateRef.current?.owner == signer || controlStateRef.current?.admins.includes(signer)) //do we care if only creator can (de)activate
                        poll.active = payload.active
                    return [...x]
                })
            }, true, d.autoEncrypt)
            d.on(MessageType.SNAPSHOT, (payload:Snapshot, signer: Signer, meta: DispatchMetadata) => {
                if (!id) return
                if (signer == wallet?.address) return
                const snap = getStoredSnapshotInfo(id)
                if (snap !== undefined) {
                    if (payload.timestamp === undefined) {
                        console.error("old version of snapshot, ignoring")
                        return
                    }
                    if (snap.timestamp > payload.timestamp) {
                        console.debug("new snapshot is older than loaded one")
                        return
                    }
                    if (snap.hash == payload.hash) {
                        console.log("already on this snapshot")
                        return
                    }

                    if (payload.timestamp+18*60*60*1000 < Date.now()) {
                        console.log("snapshot older than 18h, ignoring")
                        return
                    }
                }

                //console.log("will import messages")
                setSnapshot(payload)
            }, true, d.autoEncrypt, d.contentTopic, false)
            console.debug("Dispatching local query")
            updateStatus("Dispatching local query", "info", 2000)

            await d.start()
            try {
                await d.dispatchLocalQuery() 

                if (localQuestions.length == 0) {
                    await d.dispatchQuery()
                }
            } catch (e) {
                console.error(e)
                updateStatus("Local query failed: " + e, "error")

            }
            console.debug("Local query done")
            updateStatus("Local query done", "info", 2000)

            setDispatcher(d)
            setLoading(false)
        })()
    }, [dispatcher, id, node, password])

    useEffect(() => {
        if (!dispatcher || !wallet || !id || !controlState) return

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
    }, [dispatcher, wallet, id, controlState])

    useEffect(() => {
        if (id != lastId) {
            (async () =>{
                clearInterval(regularSnapshotInterval)
                setLastId(id)
                setControlState(undefined)
                setOwner(false)
                setAdmin(false)
                setQuestions(new Map<string, EnhancedQuestionMessage>())
                setActive(1)
                setSnapshot(undefined)
                setPolls([])
                await destroyDispatcher() //FIXME: Will this work?
                setDispatcher(undefined)
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
        if (!controlState || !wallet || !id) return

        setVisited((v) => {
            if (password)
                id = id +"/"+password
            const exist = v.find((e) => e.id == id)
            if (!exist) return [...v, {id: id!, title: controlState.title}]

            return v
        })

        setOwner(controlState.owner == wallet.address)
        setAdmin(controlState.admins.includes(wallet.address))
    }, [controlState, wallet])

    useEffect(() => {
        if (!activeList) return
        setActive(activeList.length)
    }, [activeList])

    useEffect(() => {
        const q = Array.from(questions.values())

        q.sort((a:EnhancedQuestionMessage, b:EnhancedQuestionMessage) => {
                    if (a.moderated) return 1
                    if (b.moderated) return -1
                    if (a.answered && b.answered) return b.upvotes - a.upvotes
                    if (a.answered && !b.answered) return 1
                    if (!a.answered && b.answered) return -1

                    return b.upvotes - a.upvotes
                })
        setLocalQuestions(q)
    }, [questions, controlState, wallet])

    useEffect(() => {
        if (!dispatcher || !snapshot || !id) return

        (async () => {
            try {
                //console.log(snapshot)
                if (await importFromSnapshot(snapshot.cid)) {
                    setStoredSnapshotInfo(id, snapshot)
                }
            } catch (e) {
                console.error(e)
            }
        })()


    }, [dispatcher, snapshot, id])

    const qakuInfo = useMemo(
        () => ({
            controlState,
            wallet,
            isOwner,
            isAdmin,
            visited,
            localQuestions,
            active,
            polls,
            switchState,
            getHistory,
            historyAdd,
            importPrivateKey,
            dispatcher,
            loading,
            publishSnapshot,
            snapshot: doSnapshot,
        }),
        [
            controlState,
            wallet,
            isOwner,
            isAdmin,
            visited,
            localQuestions,
            active,
            polls,
            switchState,
            getHistory,
            historyAdd,
            importPrivateKey,
            dispatcher,
            loading,
            doSnapshot,
            publishSnapshot,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}