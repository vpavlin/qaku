import { useParams } from "react-router-dom";
import NewQuestion from "./newq";
import { useState } from "react";

import { QuestionMessage, unique } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";


const QA = () => {

    const  { controlState, questions } = useQakuContext()
    
    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            <h2 className="text-2xl">{controlState?.title}</h2>
            { controlState && controlState?.enabled &&
                <NewQuestion id={controlState.id} />
            }
            {
                questions.map((msg, i) => 
                    <div key={i.toString()} className="border rounded-xl p-2 m-1">
                        <div className="text-left">{msg.question}</div>
                        <div className="text-right text-sm"> ({msg.timestamp.toLocaleString()})</div>
                    </div>
                )
            }
        </div>
    )
}

export default QA;