import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";

import Question from "./question";
import { PageDirection } from "@waku/sdk";
import CreatePoll from "./polls/create";
import { useEffect, useState } from "react";
import Poll from "./polls/poll";
import Polls from "./polls/poll";
import { useLocation } from "react-router-dom";

enum Tabs {
    Questions = "questions",
    Polls = "polls"
}

const QA = () => {

    const  { controlState, localQuestions, dispatcher, isOwner } = useQakuContext()
    const {hash} = useLocation()
    

    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Questions)

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

    return (
        <div className="text-center max-w-5xl m-auto space-y-3 bg-base-300 h-full p-3">
            <div>
                <button className="btn btn-sm" disabled={!dispatcher} onClick={() => {dispatcher?.clearDuplicateCache();dispatcher?.dispatchQuery({pageDirection: PageDirection.FORWARD, pageSize: 100}, true)} }>Force Reload</button>
            </div>
            { controlState &&
            <div  className="space-y-3">
                {controlState.moderation && <div className="bg-error text-error-content text-xl rounded-md m-3 p-3"> This Q&A can be moderated by owner (i.e. questions can be hidden!)</div>}
                <h2 className="text-5xl">{controlState?.title}</h2>
                <div className="divider"></div>
                <div className="text-justify m-auto max-w-2xl">
                    {controlState?.description}
                </div>
                <div className="badge badge-lg badge-neutral">{controlState.owner.slice(0, 7)+"..."+controlState.owner.slice(controlState.owner.length-5)}</div>
                <div className="divider"></div>

                {controlState.enabled &&
                    <NewQuestion id={controlState.id} />
                }
                {isOwner &&
                    <CreatePoll />
                }
                <div className="tabs m-auto ">
                    <a href={`#${Tabs.Questions}`} className={`tab tab-lg tab-bordered ${activeTab == Tabs.Questions && "tab-active"}`} onClick={() => setActiveTab(Tabs.Questions)}>Questions</a>
                    <a href={`#${Tabs.Polls}`} className={`tab tab-lg tab-bordered ${activeTab == Tabs.Polls && "tab-active"}`} onClick={() => setActiveTab(Tabs.Polls)}>Polls</a>
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