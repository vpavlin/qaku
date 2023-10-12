import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";

import Question from "./question";

const QA = () => {

    const  { controlState, localQuestions } = useQakuContext()
    
    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            { controlState &&
                <>
                    <div>Owner: {controlState.owner.slice(0, 7)+"..."+controlState.owner.slice(controlState.owner.length-5)}</div>
                    {controlState.moderation && <div className="bg-error text-error-content text-xl rounded-md m-3 p-3"> This Q&A can be moderated by owner (i.e. questions can be hidden!)</div>}
                </>
            }
            <h2 className="text-2xl">{controlState?.title}</h2>
            { controlState && controlState?.enabled &&
                <NewQuestion id={controlState.id} />
            }
            {
                localQuestions.map((msg, i) => 
                    <Question moderation={controlState!.moderation} msg={msg} />
                )
            }
        </div>
    )
}

export default QA;