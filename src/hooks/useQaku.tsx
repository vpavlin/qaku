import React, { useContext, useEffect, useMemo, useState } from "react";
import { ActivityMessage, AnsweredMessage, ControlMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, parseAnsweredMessage, parseControlMessage, parseModerationMessage, parseQakuMessage, parseQuestionMessage, parseUpvoteMessage, unique } from "../utils/messages";
import { useWakuContext } from "./useWaku";
import { DecodedMessage, PageDirection, StoreQueryOptions, bytesToUtf8, createDecoder } from "@waku/sdk";
import { CONTENT_TOPIC_ACTIVITY, CONTENT_TOPIC_MAIN } from "../constants";
import { sha256 } from "js-sha256";
import { toHex } from "../utils/crypto";
import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";
import { Wallet } from "ethers";

export type HistoryEntry = {
    id: string;
    title: string;
}

export type QakuInfo = {
    controlState: ControlMessage | undefined;
    wallet: Wallet | undefined;
    isOwner: boolean;
    active: number;
    loading: boolean;
    visited: HistoryEntry[]
    historyAdd: (id: string, title: string) => void
    getHistory: () => HistoryEntry[]
    switchState: (newState: boolean) => void;
    importPrivateKey: (key: string) => void;
    localQuestions: EnhancedQuestionMessage[]
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
    children: React.ReactNode;
}


export const QakuContextProvider = ({ id, children }: Props) => {
    const [ lastId, setLastId ] = useState<string>()
    const [ controlState, setControlState ] = useState<ControlMessage>()
    const [ questions, setQuestions ] = useState<QuestionMessage[]>([])
    const [ wallet, setWallet] = useState<Wallet>()
    const [ isOwner, setOwner ] = useState<boolean>(false)
    const [ active, setActive ] = useState<number>(0)
    const [ activeList, setActiveList ] = useState<ActivityMessage[]>([])

    const [ msgCache, setMsgCache ] = useState<QakuMessage[]>([])
    const [ answeredMsgs, setAnsweredMsgs ] = useState<AnsweredMessage[]>([])
    const [ moderatedMsgs, setModeratedMsgs ] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const [ upvotes, setUpvotes ] = useState<Map<string, string[]>>(new Map<string, string[]>())
    const [ msgEvents, setMsgEvents ] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const [ history, setHistory ] = useState<HistoryEntry[]>([])
    const [ visited, setVisited ] = useState<HistoryEntry[]>([])

    const [localQuestions, setLocalQuestions] = useState<EnhancedQuestionMessage[]>([])

    const {connected, query, subscribe, publish, node} = useWakuContext()

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

    const callback = (msg: DecodedMessage) => {
        const parsed = parseQakuMessage(msg)
        if (!parsed) return
        setMsgCache((msgs) => [...msgs, parsed])
    }

    const isModerated = (msg:QuestionMessage): boolean => {
        const hash = sha256(JSON.stringify(msg))

        // @ts-ignore
        const moderated:boolean | undefined = moderatedMsgs.get(hash)

        return moderated !== undefined && moderated
    }

    const isAnswered = (msg:QuestionMessage): [boolean, AnsweredMessage | undefined] => {
        const hash = sha256(JSON.stringify(msg))

        const answerMsg: AnsweredMessage | undefined = answeredMsgs.find((m, i) => m.hash == hash)

        return [answerMsg !== undefined, answerMsg]
    }

    const upvoted = (msg:QuestionMessage):[number, string[] | undefined] => {
        const hash = sha256(JSON.stringify(msg))
        const u = upvotes.get(hash)
        return [u ? u.length : 0, u]
    }

    const handleMessage = (msg: QakuMessage, controlState: ControlMessage | undefined): ControlMessage | undefined => {
        setMsgEvents((me) => me + 1)
        switch (msg.type) {
            case MessageType.CONTROL_MESSAGE:
                const cmsg = parseControlMessage(msg)
                if (cmsg) setControlState(cmsg)
                return cmsg

            case MessageType.QUESTION_MESSAGE:
                const qmsg = parseQuestionMessage(msg);
  
                if (!qmsg) break
                if (!controlState?.enabled) break

                setQuestions((q) => unique<QuestionMessage>([...q, qmsg]))

                break;
            case MessageType.ANSWERED_MESSAGE:
                const amsg = parseAnsweredMessage(msg)
                if (!amsg) break
                setAnsweredMsgs((m) => [...m, amsg])
                break;

            case MessageType.MODERATION_MESSAGE:
                const mmsg = parseModerationMessage(msg)
                if (!mmsg) break
                setModeratedMsgs((m) => {
                    m.set(mmsg.hash, mmsg.moderated)
                    return new Map<string, boolean>(m)
                })
                break;

            case MessageType.UPVOTE_MESSAGE:
                const umsg = parseUpvoteMessage(msg)
                if (!umsg) break
                setUpvotes((m) => {
                    if (!m.has(umsg.hash))
                        m.set(umsg.hash, [])
                    const signers = m.get(umsg.hash)
                    if (!signers?.find((it) => it == msg.signer))
                        signers?.push(msg.signer)
                    
                    m.set(umsg.hash, signers!)
                    return new Map<string, string[]>(m)
                })
                break;
            default:
                return;
        }

        return controlState
    }

    const switchState = (newState: boolean) => {
        if (!id || !controlState || !connected || !wallet) return

        const cmsg:ControlMessage = {
            title: controlState.title,
            description: controlState.description,
            id: controlState.id,
            enabled: newState,
            timestamp: new Date(),
            owner: controlState.owner,
            admins: controlState.admins,
            moderation: controlState.moderation
        }
        
        const msg:QakuMessage = {type: MessageType.CONTROL_MESSAGE, payload: JSON.stringify(cmsg), signer: wallet.address, signature: undefined}
        const sig = wallet.signMessageSync(JSON.stringify(cmsg))
        if (!sig) return
   
        msg.signature = sig

        publish(CONTENT_TOPIC_MAIN(id), JSON.stringify(msg))
    }

    const importPrivateKey = (result: string) => {
        const parsed = JSON.parse(result)
        const w = new Wallet(parsed.key)
        localStorage.setItem("qaku-key-v2", w.privateKey)

        setHistory(parsed.history)
        
        window.location.reload()

    }

    useEffect(() => {
        if (id != lastId) {
            setLastId(id)
            setControlState(undefined)
            setOwner(false)
            setQuestions([])
            setMsgCache([])
            setActive(1)
        }
    }, [id])

    useEffect(() => {
        let k = localStorage.getItem("qaku-key-v2")
        if (!k) {
            const newKey = generatePrivateKey()
            const w = new Wallet(toHex(newKey))
            localStorage.setItem("qaku-key-v2", w.privateKey)
            k = w.privateKey
        }

        const w = new Wallet(k)
        setWallet(w)
  
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
            const exist = v.find((e) => e.id == id)
            if (!exist) return [...v, {id: id!, title: controlState.title}]

            return v
        })

        setOwner(controlState.owner == wallet.address)
    }, [controlState, wallet])

    useEffect(() => {
        if (!connected || !id || !wallet || !node) return
        setLoading(true) 

        node.store.queryOrderedCallback(
            [createDecoder(CONTENT_TOPIC_MAIN(id))],
            callback,
            {
                pageDirection: PageDirection.FORWARD,
                pageSize: 100,
            },
        ).then(() => setLoading(false));

        const unsubscribe = subscribe(CONTENT_TOPIC_MAIN(id), callback)

        return () => {
            if (unsubscribe) {
                if (unsubscribe instanceof Promise) {
                    unsubscribe.then((unsub)=> unsub())
                } else {
                    unsubscribe()
                }
            }
        }
    }, [connected, id, wallet, node])

    useEffect(() => {
        if (!id || !connected || !wallet) return

        const tracker = setInterval(async () => {
            const msg:ActivityMessage = {pubKey: wallet.address!}
            try {
                await publish(CONTENT_TOPIC_ACTIVITY(id), JSON.stringify(msg))
            } catch (e) {
                console.log(e)
            }

            const start = new Date()
            const end = new Date()

            start.setSeconds(end.getSeconds() - 30)
            const options:StoreQueryOptions = {
                pageDirection: PageDirection.BACKWARD,
                timeFilter:{
                    startTime:start,
                    endTime: end,
                }
            }
            query<ActivityMessage>(CONTENT_TOPIC_ACTIVITY(id), callback_activity, options).then((msgs) => {
                const umsg = unique<ActivityMessage>(msgs)
                setActiveList(umsg)
            })
        }, 10000)

        return () => {
            clearInterval(tracker)
        }
    }, [id, connected, wallet])

    useEffect(() => {
        if (!activeList) return
        setActive(activeList.length)
    }, [activeList])

    useEffect(() => {
        if (msgCache.length == 0) return

        const msg:QakuMessage = msgCache[0]
        setMsgCache([...msgCache.slice(1)])
        handleMessage(msg, controlState)
    }, [msgCache])

    useEffect(() => {
        if (!questions) return

        let questionsCopy = questions.slice(0)

        if (controlState?.moderation && !isOwner) {
            questionsCopy = questionsCopy.filter((m) => !isModerated(m))
        }

        setLocalQuestions(questionsCopy.map((q)=> {
            const [u, upvoters] = upvoted(q)
            const [answered, answerMsg] = isAnswered(q)

            const lq: EnhancedQuestionMessage = {
                question: q.question,
                timestamp: q.timestamp,
                answer: answerMsg && answerMsg.text,
                answered: answered,
                upvotes: u,
                upvotedByMe: !!(upvoters && wallet && upvoters.indexOf(wallet.address) >= 0),
                moderated: false
            }
            if (isOwner && controlState?.moderation) lq.moderated = isModerated(q)

            return lq
        }).sort((a:EnhancedQuestionMessage, b:EnhancedQuestionMessage) => {
            
            if (a.moderated) return 1
            if (b.moderated) return -1
            if (a.answered && b.answered) return b.upvotes - a.upvotes
            if (a.answered && !b.answered) return 1
            if (!a.answered && b.answered) return -1

            return b.upvotes - a.upvotes
        }))

    }, [questions, msgEvents, controlState])

    const qakuInfo = useMemo(
        () => ({
            controlState,
            wallet,
            isOwner,
            loading,
            visited,
            localQuestions,
            active,
            switchState,
            getHistory,
            historyAdd,
            importPrivateKey,
        }),
        [
            controlState,
            wallet,
            isOwner,
            loading,
            visited,
            localQuestions,
            active,
            switchState,
            getHistory,
            historyAdd,
            importPrivateKey,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}