import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";

import Question from "./question";
import { PageDirection } from "@waku/sdk";
import CreatePoll from "./polls/create";
import { useState } from "react";
import Poll from "./polls/poll";
import Polls from "./polls/poll";

enum Tabs {
    Questions,
    Polls
}

const QA = () => {

    const  { controlState, localQuestions, dispatcher, isOwner } = useQakuContext()
    

    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Questions)

    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            <div>
                <button className="btn btn-sm" disabled={!dispatcher} onClick={() => {dispatcher?.clearDuplicateCache();dispatcher?.dispatchQuery({pageDirection: PageDirection.FORWARD, pageSize: 20}, true)} }>Force Reload</button>
            </div>
            { controlState &&
            <>
                <div>Owner: {controlState.owner.slice(0, 7)+"..."+controlState.owner.slice(controlState.owner.length-5)}</div>
                {controlState.moderation && <div className="bg-error text-error-content text-xl rounded-md m-3 p-3"> This Q&A can be moderated by owner (i.e. questions can be hidden!)</div>}
                <h2 className="text-2xl">{controlState?.title}</h2>
                <div>
                    {controlState?.description}
                </div>
                {controlState.enabled &&
                    <NewQuestion id={controlState.id} />
                }
                {isOwner &&
                    <CreatePoll />
                }
                <div className="tabs m-auto ">
                    <a className={`tab tab-lg tab-bordered ${activeTab == Tabs.Questions && "tab-active"}`} onClick={() => setActiveTab(Tabs.Questions)}>Questions</a> 
                    <a className={`tab tab-lg tab-bordered ${activeTab == Tabs.Polls && "tab-active"}`} onClick={() => setActiveTab(Tabs.Polls)}>Polls</a> 
                </div>
                <div>
                {
                    activeTab == Tabs.Questions &&
                        localQuestions.map((msg, i) => 
                            <Question moderation={controlState!.moderation} msg={msg} key={i.toString()} />
                        )
                }
                {
                    activeTab == Tabs.Polls &&
                        <Polls />
                }
                </div>
            </>
        }
        </div>
    )
}

export default QA;