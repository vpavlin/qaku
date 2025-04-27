import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";

import Question from "./question";
import CreatePoll from "./polls/create";
import { useEffect, useState } from "react";
import Polls from "./polls/poll";
import { useLocation, useNavigate, useParams } from "react-router-dom";

enum Tabs {
    Questions = "questions",
    Polls = "polls"
}

const QA = () => {

    const  { controlState, localQuestions, qaku, isOwner, isAdmin, polls, ready, } = useQakuContext()
    const {hash} = useLocation()
    
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Questions)

    let { id } = useParams<"id">();
    let { password } = useParams<"password">();

    const [needsPassword, setNeedsPassword] = useState<boolean>()
    const [passwordInput, setPasswordInput] = useState<string>()
    const [ownerENS, setOwnerENS] = useState<string>()


    useEffect(() => {
        console.log(hash)
        switch(hash) {
            case "#"+Tabs.Polls:
                setActiveTab(Tabs.Polls)
                break;
            case "#"+Tabs.Questions:
                setActiveTab(Tabs.Questions)
                break
            default:
                setActiveTab(Tabs.Questions)
        }
    }, [hash])

    useEffect(() => {
        setNeedsPassword(!(password || (id && !id.startsWith("X"))))
    }, [id, password])

    useEffect(() => {
        if (controlState && controlState.delegationInfo) {
            console.log("trying to get ens")
            qaku?.externalWallet?.getName(controlState.delegationInfo.externalAddress).then(name => {
                console.log("Got ens:", name)
                name && setOwnerENS(name)
            }).catch(e => console.debug(e))
        }
    }, [controlState, ready, qaku])
        

    return (
        <div className="text-center max-w-5xl m-auto space-y-3 bg-base-300 h-full p-3">
            {
                needsPassword &&
                <div>
                    <input className="input input-lg input-bordered" type="password" onChange={(e) => setPasswordInput(e.target.value)} />
                    <div><button className="btn btn-lg" onClick={() => navigate(`/q/${id}/${passwordInput}`)}>Unlock</button></div>
                </div>
            }
    
            {!ready && <span className="loading loading-lg"></span>}
            { controlState &&
            <div  className="space-y-3">
                {controlState.moderation && <div className="bg-error text-error-content text-xl rounded-md m-3 p-3"> This Q&A can be moderated by owner (i.e. questions can be hidden!)</div>}
                <h2 className="text-5xl">{controlState?.title}</h2>
                <div className="divider"></div>
                <div className="text-justify m-auto max-w-2xl">
                    {controlState?.description}
                </div>
                <div className="space-x-2">
                    <div className="badge badge-lg badge-neutral">{ownerENS || controlState.owner.slice(0, 7)+"..."+controlState.owner.slice(controlState.owner.length-5)}</div>
                    {isAdmin ? <div className="badge badge-lg badge-secondary">admin</div> : <div className="badge badge-lg badge-primary">owner</div>}
                </div>
                <div className="divider"></div>

                {controlState.enabled &&
                    <NewQuestion id={controlState.id} />
                }
                {(isOwner || isAdmin) &&
                    <CreatePoll id={controlState.id} />
                }
                <div className="tabs tabs-lifted tabs-lg m-auto ">
                    <a href={`#${Tabs.Questions}`} className={`tab ${activeTab == Tabs.Questions && "tab-active"}`} onClick={() => setActiveTab(Tabs.Questions)}>Questions ({localQuestions.length})</a>
                    <a href={`#${Tabs.Polls}`} className={`tab ${activeTab == Tabs.Polls && "tab-active"}`} onClick={() => setActiveTab(Tabs.Polls)}>Polls ({polls.length})</a>
                </div>
                <div className="px-1">
                {
                    activeTab == Tabs.Questions && (
                        localQuestions.length == 0 ?
                            <div className="p-5">There are no questions yet.</div>
                        :
                            localQuestions.filter((msg => isAdmin || isOwner || !msg.moderated)).map((msg, i) =>
                                <Question id={controlState.id} moderation={controlState.moderation} msg={msg} key={i.toString()} />
                            )
                    )
                }
                {
                    activeTab == Tabs.Polls &&
                        <Polls id={controlState.id} />
                }
                </div>
                
            </div>
        }
        </div>
    )
}

export default QA;

/*       <!--<div>
<button className="btn btn-sm" disabled={!qaku} onClick={() => {dispatcher?.clearDuplicateCache();dispatcher?.dispatchQuery()} }>Force Reload</button>
</div>-->
*/