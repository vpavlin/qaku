import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";

import Question from "./question";

const QA = () => {

    const  { controlState, localQuestions, dispatcher } = useQakuContext()
    
    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            <div>
                <button className="btn btn-sm" disabled={!dispatcher} onClick={() => dispatcher?.dispatchQuery() }>Force Reload</button>
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
                {
                    localQuestions.map((msg, i) => 
                        <Question moderation={controlState!.moderation} msg={msg} key={i.toString()} />
                    )
                }
            </>
        }
        </div>
    )
}

export default QA;