import { useParams } from "react-router-dom";
import NewQuestion from "./newq";
import { useState } from "react";

import { AnsweredMessage, MessageType, QakuMessage, QuestionMessage, unique } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";
import { sha256 } from "js-sha256";
import { signMessage } from "../utils/crypto";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { useWakuContext } from "../hooks/useWaku";


const QA = () => {

    const  { controlState, questions, isAnswered, isOwner, pubKey, key } = useQakuContext()
    const {connected, publish} = useWakuContext()


    const publishAnswer =  async (qmsg:QuestionMessage) => {
        if (!key || !pubKey || !connected || !controlState) return
        const hash = sha256(JSON.stringify(qmsg))

        const amsg:AnsweredMessage = {hash: hash}
        const msg:QakuMessage = {payload: JSON.stringify(amsg), type: MessageType.ANSWERED_MESSAGE, signer: pubKey!, signature: undefined}


        const sig = signMessage(key, JSON.stringify(amsg))
        if (!sig) return

        msg.signature = sig
        const result = await publish(CONTENT_TOPIC_MAIN(controlState.id), JSON.stringify(msg))

        if (!result || result.error) console.log(result)
    }
    
    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            <h2 className="text-2xl">{controlState?.title}</h2>
            { controlState && controlState?.enabled &&
                <NewQuestion id={controlState.id} />
            }
            {
                questions.map((msg, i) => 
                    <div key={i.toString()} className={`border rounded-xl p-2 m-1 ${isAnswered(msg) && "opacity-60 bg-primary"}`}>
                        <div className="text-left">{msg.question}</div>
                        <div className={`text-right text-sm`}> ({msg.timestamp.toLocaleString()}) </div>
                        {isOwner && !isAnswered(msg) && <button className="btn" onClick={() => publishAnswer(msg)}>Answered</button>}
                    </div>
                )
            }
        </div>
    )
}

export default QA;