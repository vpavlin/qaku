import { useParams } from "react-router-dom";
import NewQuestion from "./newq";
import { useEffect, useState } from "react";

import { AnsweredMessage, MessageType, QakuMessage, QuestionMessage, UpvoteMessage, unique } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";
import { sha256 } from "js-sha256";
import { signMessage } from "../utils/crypto";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { useWakuContext } from "../hooks/useWaku";


const QA = () => {

    const  { controlState, questions, isAnswered, isOwner, pubKey, key, upvoted, msgEvents } = useQakuContext()
    const {connected, publish} = useWakuContext()
    const [localQuestions, setLocalQuestions] = useState<QuestionMessage[]>([])


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

    const upvote = async (qmsg: QuestionMessage) => {
        if (!key || !pubKey || !connected || !controlState) return
        const hash = sha256(JSON.stringify(qmsg))

        const amsg:UpvoteMessage = {hash: hash}
        const msg:QakuMessage = {payload: JSON.stringify(amsg), type: MessageType.UPVOTE_MESSAGE, signer: pubKey!, signature: undefined}

        const sig = signMessage(key, JSON.stringify(amsg))
        if (!sig) return

        msg.signature = sig
        const result = await publish(CONTENT_TOPIC_MAIN(controlState.id), JSON.stringify(msg))

        if (!result || result.error) console.log(result)
    }

    useEffect(() => {
        if (!questions) return
        setLocalQuestions([...questions.sort((a, b) => {
            const ua = upvoted(a)
            const ub = upvoted(b)
            const aa = isAnswered(a)
            const ab = isAnswered(b)
            
            if (aa && ab) return ub - ua
            if (aa && !ab) return 1
            if (!aa && ab) return -1

            return ub - ua
        })])
    }, [questions, msgEvents])
    
    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            <h2 className="text-2xl">{controlState?.title}</h2>
            { controlState && controlState?.enabled &&
                <NewQuestion id={controlState.id} />
            }
            {
                localQuestions.map((msg, i) => 
                    <div key={i.toString()} className={`border rounded-xl p-2 m-1 ${isAnswered(msg) && "opacity-60 bg-red-100"} hover:opacity-100`}>
                        <div className="text-left">{msg.question}</div>
                        <div className={`text-right text-sm flex gap-x-2 justify-end items-center`}>
                            <div className="font-bold">
                                {!isAnswered(msg) && <button className="btn btn-sm" onClick={() => upvote(msg)}>Upvote </button>} <span className="bg-secondary border rounded-md p-1 text-secondary-content border-secondary">{upvoted(msg)}</span>
                            </div>
                            <div>
                                {isOwner && !isAnswered(msg) && <button className="btn btn-sm" onClick={() => publishAnswer(msg)}>Answered</button>}
                            </div>
                            <div className="bg-secondary border rounded-md p-1 text-secondary-content border-secondary">
                                {msg.timestamp.toLocaleString()}
                            </div>
                        </div>
                        
                    </div>
                )
            }
        </div>
    )
}

export default QA;