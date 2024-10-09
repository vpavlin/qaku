import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityMessage, AnsweredMessage, ControlMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, UpvoteMessage, unique } from "../utils/messages";
import { DecodedMessage, bytesToUtf8, createDecoder, utf8ToBytes } from "@waku/sdk";
import { CONTENT_TOPIC_ACTIVITY, CONTENT_TOPIC_MAIN } from "../constants";
import { sha256 } from "js-sha256";
import { Wallet } from "ethers";
import getDispatcher, { DispatchMetadata, Dispatcher, Signer, destroyDispatcher } from "waku-dispatcher"
import useIdentity from "./useIdentity";
import { LocalPoll, NewPoll, Poll, PollActive, PollVote } from "../components/polls/types";
import { useWakuContext } from "./useWaku";

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
    children: React.ReactNode;
}


export const QakuContextProvider = ({ id, password, children }: Props) => {
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

    const [ answeredMsgs, setAnsweredMsgs ] = useState<AnsweredMessage[]>([])
    const [ moderatedMsgs, setModeratedMsgs ] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const [ upvotes, setUpvotes ] = useState<Map<string, string[]>>(new Map<string, string[]>())

    const [ history, setHistory ] = useState<HistoryEntry[]>([])
    const [ visited, setVisited ] = useState<HistoryEntry[]>([])

    const [questions, setQuestions] = useState<Map<string, EnhancedQuestionMessage>>(new Map<string, EnhancedQuestionMessage>())
    const [localQuestions, setLocalQuestions] = useState<EnhancedQuestionMessage[]>([])

    const { wallet, storePrivateKey } = useIdentity("qaku-key-v2", "qaku-wallet")

    const [polls, setPolls] = useState<LocalPoll[]>([])

    const [ loading, setLoading ] = useState<boolean>(false)


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
            timestamp: new Date(),
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

    useEffect(() => {
        console.log(id)
        console.log(password)
        console.log(id && id.startsWith("X") && !password)
        if (dispatcher || !id || !node || (id && id.startsWith("X") && !password)) return;
   

        (async () => {
            setLoading(true)
            let d: Dispatcher | null = null
            let retries = 0
            while(!d && retries < 10) {
                d = await getDispatcher(node, CONTENT_TOPIC_MAIN(id), "qaku-"+id, false)
                await new Promise((r) => setTimeout(r, 100))
                retries++
            }
            if (!d) {
                setLoading(false)
                return
            }
            if (password) {
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

                console.log(payload.hash)
                console.log(signer)
                console.log(wallet?.address)

                setQuestions((lq) => {
                    const q =  lq.get(payload.hash)
                    console.log(q)
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
                    if (q.answered) return lq
                    q.moderated = true

                    lq.set(payload.hash, q)

                    return new Map(lq)
                })
            }, true, d.autoEncrypt)
            d.on(MessageType.POLL_CREATE_MESSAGE, (payload: NewPoll, signer: Signer, meta: DispatchMetadata) => {
                console.log(payload)
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
            console.debug("Dispatching local query")
            try {
                await d.dispatchLocalQuery() 

                if (localQuestions.length == 0) {
                    await d.dispatchQuery()
                }
            } catch {
                console.log("Some error")
            }
            console.debug("Local query done")
            setDispatcher(d)
            setLoading(false)
        })()
    }, [dispatcher, id, node, password])

    useEffect(() => {
        if (id != lastId) {
            (async () =>{
                setLastId(id)
                setControlState(undefined)
                setOwner(false)
                setAdmin(false)
                setQuestions(new Map<string, EnhancedQuestionMessage>())
                setActive(1)
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

    /*useEffect(() => {
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
    }, [id, connected, wallet])*/

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
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}