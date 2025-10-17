import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL, DEFAULT_PUBLISH_INTERVAL } from "../constants";
import { useWakuContext } from "./useWaku";
import {HistoryTypes, HistoryEntry, LocalPoll, Qaku, QakuEvents, QakuState, QuestionSort, History, HistoryEvents, Id, ControlMessage, EnhancedQuestionMessage, ActivityMessage, DelegationInfo, ExternalWallet} from "qakulib"
import { ethers } from "ethers";
import { shortAddr } from "../utils/crypto";

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
    handleConnectWallet: () => void;
    requestSign: () => void;
    walletConnected: boolean
    externalAddr: string | undefined
    delegationValid: boolean
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

    const codexURL = localStorage.getItem(CODEX_URL_STORAGE_KEY) || DEFAULT_CODEX_URL
    const publicCodexURL = localStorage.getItem(CODEX_PUBLIC_URL_STORAGE_KEY) || DEFAULT_PUBLIC_CODEX_URL

    const [codexAvailable, setCodexAvailable] = useState(false)


    useEffect(() => {
        if (!node || qaku) return
        (async () => {
            updateStatus("Loading Qaku", "info", 2000)

            const q = new Qaku(node as any) //FIXME
            setHistoryService(q.history)

            let walletProvider:ethers.BrowserProvider | undefined = undefined
 
            if ('ethereum' in window && window.ethereum) {
                walletProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
            }

            await q.init(codexURL, publicCodexURL, walletProvider as any)
            console.log("Qaku is ready")
            setQaku(q)
        })()

    }, [node, qaku])

    useEffect(() => {
        if (!qaku || !id || !node || (id && id.startsWith("X") && !password)) return;
   
        const updateQuestions = (qid: Id) => {
            if (qid != id) return
            const questions = qaku.getQuestions(qid, sorting)
            setLocalQuestions(questions)
        } 

        const updateControlState = (qid: Id) => {
            if (qid != id) return
            const qa = qaku.qas.get(qid)
            if (!qa) {
                console.error("QA not found")
                return
            }
            console.log("setting control state")
            setControlState(qa.controlState)
            setProtocolInitialized(true)
            updateQuestions(qid)
            
        }

        const updatePolls = (qid: Id) => {
            if (qid != id) return
            const polls = qaku.getPolls(id)
            setPolls([...polls])
        }

        (async () => {
            setLoading(true)
            qaku.on(QakuEvents.NEW_QUESTION, updateQuestions)
            qaku.on(QakuEvents.NEW_ANSWER, updateQuestions)
            qaku.on(QakuEvents.NEW_MODERATION, updateQuestions)
            qaku.on(QakuEvents.NEW_UPVOTE, updateQuestions)
            qaku.on(QakuEvents.NEW_CONTROL_MESSAGE, updateControlState)

            qaku.on(QakuEvents.NEW_POLL, updatePolls.bind(id))
            qaku.on(QakuEvents.NEW_POLL_VOTE, updatePolls.bind(id))
            qaku.on(QakuEvents.POLL_STATE_CHANGE, updatePolls.bind(id))

            let qa = qaku.qas.get(id)
            if (!qa || !protocolInitialized) {
               /* qaku.on(QakuEvents.QAKU_STATE_UPDATE, ((state: string, qid: Id) => {
                    if (state == QakuState.INIT_PROTOCOL && qid == id) {
                        setProtocolInitialized(true)
                    }
                }).bind(id))*/

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
                updateQuestions(id)
            }
            if (lastId == undefined) {
                setLastId(id)
            }
            updateStatus("Qaku initialized", "info", 2000)
            setLoading(false)
         
            setLoading(false)
        })()

        return () => {
            console.log("Clearing Qaku listeners")
            qaku.off(QakuEvents.NEW_QUESTION, updateQuestions)
            qaku.off(QakuEvents.NEW_ANSWER, updateQuestions)
            qaku.off(QakuEvents.NEW_MODERATION, updateQuestions)
            qaku.off(QakuEvents.NEW_UPVOTE, updateQuestions)
            qaku.off(QakuEvents.NEW_CONTROL_MESSAGE, updateControlState)

            qaku.off(QakuEvents.NEW_POLL, updatePolls.bind(id))
            qaku.off(QakuEvents.NEW_POLL_VOTE, updatePolls.bind(id))
            qaku.off(QakuEvents.POLL_STATE_CHANGE, updatePolls.bind(id))
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


    useEffect(() => {
        console.log("LastID vs. new ID", lastId, id)
        if (lastId != undefined && id != lastId) {
            console.log("Destroying everything!")

            //setQaku(undefined)
            
            //setControlState(undefined)
 
            //setQuestions(new Map<string, EnhancedQuestionMessage>())
            
            //setPolls([])
            //setLocalQuestions([])
            //await qaku?.destroy() //FIXME: Will this work?
            //setHistoryService(undefined)

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


    const [walletConnected, setWalletConnected] = useState(false);
    const [delegationInfo, setDelegationInfo] = useState<DelegationInfo | null>(null);
    const [externalWallet, setExternalWallet] = useState<ExternalWallet | null>(null);
    const [externalAddr, setExternalAddr] = useState<string>()
    const [delegationValid, setIsValid] = useState(false)


    const tryConnectWallet = async () => {
        if (!qaku || !qaku.identity) return
        if ('ethereum' in window && window.ethereum) {
         
            await qaku.externalWallet?.initExternalAddress();

            setExternalAddr(shortAddr(qaku.externalWallet?.externalAddress!))
            setWalletConnected(true)
        } else {
            console.log("COuld not find the eth provider")
        }

    };

    const handleConnectWallet = async () => {
        if ('ethereum' in window && window.ethereum) {
            const walletProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);

            await walletProvider.send('eth_requestAccounts', []);
            await tryConnectWallet()
        }
    }

    useEffect(() => {
        try {
            tryConnectWallet()
        } catch(e) {
            console.log("Could not connect", e)
        }
        
    }, [qaku])

    useEffect(() => {
        if (qaku && qaku.externalWallet) {
            qaku.externalWallet?.getName().then(name => {
                if (name) setExternalAddr(name)
            }).catch(e => console.debug(e))
            try {
                const delegationInfo = qaku.externalWallet.getDelegationInfo()
                if (!delegationInfo) {
                    console.error("Failed to get delegation info")
                    return
                }
                qaku.externalWallet.verifyDelegationInfo(delegationInfo).then(result => {
                    if (result)
                        setIsValid(true)
                    
                })
            } catch (e) {
                console.error("Could not get delegation info: ", e)
            }

        }
    }, [qaku, externalAddr])

    const requestSign =  async () => {
        if (qaku && qaku.externalWallet) {
            try {
                await qaku.externalWallet.requestSignature();
                const delegationInfo = qaku.externalWallet.getDelegationInfo();
                setDelegationInfo(delegationInfo);
                setWalletConnected(true);
            } catch (error) {
                console.error('Error connecting wallet:', error);
            }
            }
    }

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
            handleConnectWallet,
            requestSign,
            walletConnected,
            externalAddr,
            delegationValid,
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
            handleConnectWallet,
            requestSign,
            walletConnected,
            externalAddr,
            delegationValid,
        ]
    )

    return ( <QakuContext.Provider value={{ providerInfo: qakuInfo }}>
        { children }
    </QakuContext.Provider>)
}