import { useParams } from "react-router-dom";
import NewQuestion from "./newq";
import { useEffect, useState } from "react";

import { AnsweredMessage, MessageType, QakuMessage, QuestionMessage, UpvoteMessage, unique } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";
import { sha256 } from "js-sha256";
import { signMessage } from "../utils/crypto";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { useWakuContext } from "../hooks/useWaku";
import { PiThumbsUpLight} from "react-icons/pi";
import ReactMarkdown from "react-markdown";

const QA = () => {

    const  { controlState, questions, isAnswered, isOwner, pubKey, key, upvoted, msgEvents } = useQakuContext()
    const {connected, publish} = useWakuContext()
    const [localQuestions, setLocalQuestions] = useState<QuestionMessage[]>([])
    const [ answer, setAnswer ] = useState<string>()


    const publishAnswer =  async (qmsg:QuestionMessage, answer?: string) => {
        if (!key || !pubKey || !connected || !controlState) return
        const hash = sha256(JSON.stringify(qmsg))

        const amsg:AnsweredMessage = { hash: hash, text: answer }
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
            const [ua] = upvoted(a)
            const [ub] = upvoted(b)
            const [aa] = isAnswered(a)
            const [ab] = isAnswered(b)
            
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
                localQuestions.map((msg, i) => {
                    const [upvotedBy, upvoters] = upvoted(msg)
                    const alreadyUpvoted = upvoters && pubKey && upvoters.indexOf(pubKey) >= 0
                    const d = new Date(msg.timestamp)
                    const formatter = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric',  });
                    const [answered, answerMsg] = isAnswered(msg)

                    return <div key={i.toString()} className={`border rounded-xl p-3 my-2 focus:shadow-md hover:shadow-md hover:-mx-1 hover:transition-all ${answered && "opacity-60 bg-success text-success-content"} hover:opacity-100`}>
                        <div className="text-left">
                            <ReactMarkdown children={msg.question} />
                        </div>
                        { answered && answerMsg!.text && <div className="text-right pl-2 mb-2 font-bold border-t border-white"> <ReactMarkdown children={answerMsg?.text!} /></div>}
                        <div className={`text-right text-sm flex gap-x-2 justify-end items-center`}>
                            <div className="font-bold items-center">
                            {!isOwner && !answered && !alreadyUpvoted &&
                                <span className="inline-block items-center cursor-pointer focus:border focus:rounded-md" onClick={() => upvote(msg)}>
                                    <PiThumbsUpLight size={20} />
                                </span>
                            } <span className={`bg-secondary border rounded-md p-1 text-secondary-content border-secondary ${answered && "bg-primary"}`}>{upvotedBy}</span>
                            </div>
                            {isOwner && !answered &&
                                <div>
                                    <button className="btn btn-sm mx-1" onClick={() => {
                                        setAnswer("");
                                        (document.getElementById('answer_modal') as HTMLDialogElement).showModal()
                                        }}>Answer</button>
                                    <dialog id="answer_modal" className="modal">
                                        <div className="modal-box text-left">
                                            <div className="text-left m-2"><ReactMarkdown>{msg.question}</ReactMarkdown></div>
                                            <div className="font-bold m-1">Answer</div>
                                            <textarea onChange={(e) => setAnswer(e.target.value)} value={answer} className="textarea textarea-bordered w-full h-44 m-auto mb-1"></textarea>
                                            <div className="modal-action">
                                            <form method="dialog">
                                                <button className="btn btn-sm m-1" onClick={() => publishAnswer(msg, answer)}>Submit</button>
                                                <button className="btn btn-sm m-1">Close</button>
                                            </form>
                                            </div>
                                        </div>
                                    </dialog>
                                </div>
                            }
                            <div className="bg-secondary border rounded-md p-1 text-secondary-content border-secondary">
                                {`${formatter.format(d)}`}
                            </div>
                        </div>
                        
                    </div>
})
            }
        </div>
    )
}

export default QA;