import React, { useContext, useEffect, useMemo, useState } from "react";
import { ActivityMessage, AnsweredMessage, ControlMessage, MessageType, QakuMessage, QuestionMessage, parseAnsweredMessage, parseControlMessage, parseQakuMessage, parseQuestionMessage, parseUpvoteMessage, unique } from "../utils/messages";
import { useWakuContext } from "./useWaku";
import { DecodedMessage, PageDirection, StoreQueryOptions, bytesToUtf8, createDecoder } from "@waku/sdk";
import { CONTENT_TOPIC_ACTIVITY, CONTENT_TOPIC_MAIN } from "../constants";
import { eddsa as EdDSA } from 'elliptic'
import { sha256 } from "js-sha256";
import { fromHex, generateKey, loadKey, signMessage, toHex, verifyMessage } from "../utils/crypto";

export type QakuInfo = {
    controlState: ControlMessage | undefined;
    questions: QuestionMessage[];
    key: EdDSA.KeyPair | undefined;
    pubKey: string |undefined;
    isOwner: boolean;
    active: number;
    msgEvents: number;
    loading: boolean;
    upvoted: (msq: QuestionMessage) => number;
    isAnswered: (msg:QuestionMessage) => boolean;
    switchState: (newState: boolean) => void;
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
    const [ controlState, setControlState ] = useState<ControlMessage>()
    const [ questions, setQuestions ] = useState<QuestionMessage[]>([])
    const [ key, setKey] = useState<EdDSA.KeyPair>()
    const [ pubKey, setPubKey] = useState<string>()
    const [ isOwner, setOwner ] = useState<boolean>(false)
    const [ active, setActive ] = useState<number>(0)
    const [ activeList, setActiveList ] = useState<ActivityMessage[]>([])

    const [ msgCache, setMsgCache ] = useState<QakuMessage[]>([])
    const [ answeredMsgs, setAnsweredMsgs ] = useState<AnsweredMessage[]>([])
    const [ upvotes, setUpvotes ] = useState<Map<string, string[]>>(new Map<string, string[]>())
    const [ msgEvents, setMsgEvents ] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const {connected, query, subscribe, publish, node} = useWakuContext()

   
    const callback_activity = (msg: DecodedMessage) => {
        const decoded:ActivityMessage = JSON.parse(bytesToUtf8(msg.payload))
        return decoded
    }

    const callback = (msg: DecodedMessage) => {
        const parsed = parseQakuMessage(msg)
        if (!parsed) return
        setMsgCache((msgs) => [...msgs, parsed])
    }

    const isAnswered = (msg:QuestionMessage):boolean => {
        const hash = sha256(JSON.stringify(msg))

        return answeredMsgs.find((m, i) => m.hash == hash) !== undefined
    }

    const upvoted = (msg:QuestionMessage):number => {
        const hash = sha256(JSON.stringify(msg))

        const u = upvotes.get(hash)

        return u ? u.length : 0
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
                console.log(msg.payload)

                setQuestions((q) => unique<QuestionMessage>([...q, qmsg]))

                break;
            case MessageType.ANSWERED_MESSAGE:
                const amsg = parseAnsweredMessage(msg)
                if (!amsg) break
                setAnsweredMsgs((m) => [...m, amsg])
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
        if (!id || !controlState || !connected || !key || !pubKey) return

        const cmsg:ControlMessage = {title: controlState.title, id: controlState.id, enabled: newState, timestamp: new Date(), owner: controlState.owner, admins: controlState.admins}
        
        const msg:QakuMessage = {type: MessageType.CONTROL_MESSAGE, payload: JSON.stringify(cmsg), signer: pubKey!, signature: undefined}
        const sig = signMessage(key, JSON.stringify(cmsg))
        if (!sig) return
   
        msg.signature = sig

        publish(CONTENT_TOPIC_MAIN(id), JSON.stringify(msg))
    }

    useEffect(() => {
        let k = localStorage.getItem("qaku-key")
        if (!k) {
            const newKey = generateKey()
            k = toHex(newKey.getSecret())
            localStorage.setItem("qaku-key", k)
        }

        setKey(loadKey(fromHex(k)))
    }, [])

    useEffect(() => {
        if (!key) return
        setPubKey(toHex(key.getPublic()))
    }, [key])

    useEffect(() => {
        if (!controlState || !pubKey) return

        setOwner(controlState.owner == pubKey)
    }, [controlState, pubKey])

    useEffect(() => {
        if (!connected || !id || !key || !pubKey || !node) return
        setLoading(true) 

        node.store.queryOrderedCallback(
            [createDecoder(CONTENT_TOPIC_MAIN(id))],
            callback,
            {
                pageDirection: PageDirection.FORWARD,
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
    }, [connected, id, key, pubKey, node])

    useEffect(() => {
        if (!id || !connected || !key || !pubKey) return

        const tracker = setInterval(() => {
            const msg:ActivityMessage = {pubKey: pubKey!}
            publish(CONTENT_TOPIC_ACTIVITY(id), JSON.stringify(msg))

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
    }, [id, connected, key, pubKey])

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



    const qakuInfo = useMemo(
        () => ({
            controlState,
            questions,
            key,
            pubKey,
            isOwner,
            msgEvents,
            loading,
            isAnswered,
            active,
            upvoted,
            switchState,
        }),
        [
            controlState,
            questions,
            key,
            pubKey,
            isOwner,
            msgEvents,
            loading,
            isAnswered,
            active,
            upvoted,
            switchState,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}