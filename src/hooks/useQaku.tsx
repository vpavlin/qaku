import React, { useContext, useEffect, useMemo, useState } from "react";
import { ControlMessage, QuestionMessage, unique } from "../utils/messages";
import { useWakuContext } from "./useWaku";
import { DecodedMessage, bytesToUtf8 } from "@waku/sdk";
import { CONTENT_TOPIC_CONTROL, CONTENT_TOPIC_QUESTIONS } from "../constants";
import * as noise from "@waku/noise"
import { eddsa as EdDSA } from 'elliptic'
import { fromHex, generateKey, loadKey, signMessage, toHex, verifyMessage } from "../utils/crypto";

export type QakuInfo = {
    controlState: ControlMessage | undefined;
    questions: QuestionMessage[];
    key: EdDSA.KeyPair | undefined;
    pubKey: string |undefined;
    isOwner: boolean;
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

    const {connected, query, subscribe, publish} = useWakuContext()

    const callback_control = (msg: DecodedMessage) => {
        const cmsg = JSON.parse(bytesToUtf8(msg.payload))

        if (!controlState || controlState.timestamp < cmsg.timestamp) {
            if (verify(cmsg, fromHex(cmsg.signer))) {
                setControlState(cmsg)
            }
        }
    }

    const callback = (msg: DecodedMessage) => {
        const qmsg:QuestionMessage = {
            question: bytesToUtf8(msg.payload),
            timestamp: msg.timestamp!,
        } 
        setQuestions((questions) => [...questions, qmsg])
    }

    const decode = (msg: DecodedMessage) => {
        const qmsg:QuestionMessage = {
            question: bytesToUtf8(msg.payload),
            timestamp: msg.timestamp!,
        } 
       return qmsg
    }

    const verify = (msg: ControlMessage, signer: Buffer):boolean => {
        if (!msg.signature || !key) return false

        const clone:ControlMessage = { ...msg }
        clone.signature = undefined

        const valid = verifyMessage(JSON.stringify(clone), msg.signature!, signer)
        return valid
    }

    const switchState = (newState: boolean) => {
        if (!id || !controlState || !connected || !key) return

        const msg:ControlMessage = {title: controlState.title, id: controlState.id, enabled: newState, timestamp: new Date(), signer: controlState.signer, signature: undefined}
        const sig = signMessage(key, JSON.stringify(msg))
        if (!sig) return
   
        msg.signature = sig

        publish(CONTENT_TOPIC_CONTROL(id), JSON.stringify(msg))
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
        if (!controlState || !key) return

        setOwner(verify(controlState, key.getPublic()))
    }, [controlState, key])

    useEffect(() => {
        if (!connected || !id || !key || !pubKey) return 

        console.log("getting control messages")

        const unsubscribe_control = subscribe(CONTENT_TOPIC_CONTROL(id), callback_control)

        query<ControlMessage>(CONTENT_TOPIC_CONTROL(id), callback_control).then((msgs) => {
            const u:ControlMessage[] = unique<ControlMessage>(msgs)
            let e = false
            for(var msg of u) {
                if (verify(msg, fromHex(msg.signer))) {
                    setControlState(msg)
                }
            }
        })

        return () => {
            if (unsubscribe_control) {
                if (unsubscribe_control instanceof Promise) {
                    unsubscribe_control.then((unsub)=> unsub())
                } else {
                    unsubscribe_control()
                }
            }
        }
    }, [connected, id, key, pubKey])


    useEffect(() => {
        if (!id || !connected || !key) return

        let unsubscribe:any = undefined

        try {
            unsubscribe = subscribe(CONTENT_TOPIC_QUESTIONS(id), callback)
        } catch (e) {
            console.log(e)
        }

        query<QuestionMessage>(CONTENT_TOPIC_QUESTIONS(id), decode).then((msgs) => {
            const umsg = unique<QuestionMessage>(msgs)
            setQuestions((questions) => [...questions, ...umsg])
        })        

        return () => {
            if (unsubscribe) {
                if (unsubscribe instanceof Promise) {
                    unsubscribe.then((unsub)=> unsub())
                } else {
                    unsubscribe()
                }
            }
        }
    }, [id, connected, key])

    const qakuInfo = useMemo(
        () => ({
            controlState,
            questions,
            key,
            pubKey,
            isOwner,
            switchState,
        }),
        [
            controlState,
            questions,
            key,
            pubKey,
            isOwner,
            switchState,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}