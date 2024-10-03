import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";

import Question from "./question";
import CreatePoll from "./polls/create";
import { useEffect, useState } from "react";
import Poll from "./polls/poll";
import Polls from "./polls/poll";
import { useLocation, useNavigate, useParams } from "react-router-dom";

enum Tabs {
    Questions = "questions",
    Polls = "polls"
}

const QA = () => {

    const  { controlState, localQuestions, dispatcher, isOwner, isAdmin, polls } = useQakuContext()
    const {hash} = useLocation()
    
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Questions)

    let { id } = useParams<"id">();
    let { password } = useParams<"password">();

    const [needsPassword, setNeedsPassword] = useState<boolean>()
    const [passwordInput, setPasswordInput] = useState<string>()


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
        

    return (
        <div className="text-center max-w-5xl m-auto space-y-3 bg-base-300 h-full p-3">
            {
                needsPassword &&
                <div>
                    <input className="input input-lg input-bordered" type="password" onChange={(e) => setPasswordInput(e.target.value)} />
                    <div><button className="btn btn-lg" onClick={() => navigate(`/q/${id}/${passwordInput}`)}>Unlock</button></div>
                </div>
            }
            <div>
                <button className="btn btn-sm" disabled={!dispatcher} onClick={() => {dispatcher?.clearDuplicateCache();dispatcher?.dispatchQuery()} }>Force Reload</button>
            </div>
            {!dispatcher && <span className="loading loading-lg"></span>}
            { controlState &&
            <div  className="space-y-3">
                {controlState.moderation && <div className="bg-error text-error-content text-xl rounded-md m-3 p-3"> This Q&A can be moderated by owner (i.e. questions can be hidden!)</div>}
                <h2 className="text-5xl">{controlState?.title}</h2>
                <div className="divider"></div>
                <div className="text-justify m-auto max-w-2xl">
                    {controlState?.description}
                </div>
                <div className="space-x-2">
                    <div className="badge badge-lg badge-neutral">{controlState.owner.slice(0, 7)+"..."+controlState.owner.slice(controlState.owner.length-5)}</div>
                    {isAdmin && <div className="badge badge-lg badge-secondary">admin</div>}
                </div>
                <div className="divider"></div>

                {controlState.enabled &&
                    <NewQuestion id={controlState.id} />
                }
                {(isOwner || isAdmin) &&
                    <CreatePoll />
                }
                <div className="tabs m-auto ">
                    <a href={`#${Tabs.Questions}`} className={`tab tab-lg tab-bordered ${activeTab == Tabs.Questions && "tab-active"}`} onClick={() => setActiveTab(Tabs.Questions)}>Questions ({localQuestions.length})</a>
                    <a href={`#${Tabs.Polls}`} className={`tab tab-lg tab-bordered ${activeTab == Tabs.Polls && "tab-active"}`} onClick={() => setActiveTab(Tabs.Polls)}>Polls ({polls.length})</a>
                </div>
                <div>
                {
                    activeTab == Tabs.Questions && (
                        localQuestions.length == 0 ?
                            <div className="p-5">There are no questions yet.</div>
                        :
                            localQuestions.map((msg, i) =>
                                <Question moderation={controlState!.moderation} msg={msg} key={i.toString()} />
                            )
                    )
                }
                {
                    activeTab == Tabs.Polls &&
                        <Polls />
                }
                </div>
            </div>
        }
        </div>
    )
}

export default QA;