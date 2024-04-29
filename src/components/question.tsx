import { sha256 } from "js-sha256";
import { AnsweredMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, UpvoteMessage } from "../utils/messages";
import { PiThumbsUpLight } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { useQakuContext } from "../hooks/useQaku";

interface IProps {
    msg: EnhancedQuestionMessage
    moderation: boolean
}

const Question = ({msg, moderation}:IProps) => {
    const [ answer, setAnswer ] = useState<string>()

    const { controlState, isOwner, dispatcher , wallet} = useQakuContext()

    const hash = sha256(JSON.stringify(msg))
    const d = new Date(msg.timestamp)
    const formatter = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric',  });

    const publishAnswer =  async (qmsg:QuestionMessage, answer?: string) => {
        if (!wallet || !dispatcher || !controlState) return

        const hash = sha256(JSON.stringify(qmsg))
        const amsg:AnsweredMessage = { hash: hash, text: answer }
        const result = await dispatcher.emit(MessageType.ANSWERED_MESSAGE, amsg, wallet)

        if (!result || result.failures) console.log(result)
    }

    const upvote = async (qmsg: QuestionMessage) => {
        if (!wallet || !dispatcher || !controlState) return
        
        const hash = sha256(JSON.stringify(qmsg))
        const amsg:UpvoteMessage = {hash: hash}
        const result = await dispatcher.emit(MessageType.UPVOTE_MESSAGE, amsg, wallet)

        if (!result || result.failures) console.log(result)
    }

    const moderate = async (qmsg:QuestionMessage, moderated:boolean) => {
        if (!wallet || !dispatcher || !controlState) return

        const hash = sha256(JSON.stringify(qmsg))
        const mmsg:ModerationMessage = {hash:hash, moderated: moderated}
        const result = await dispatcher.emit(MessageType.MODERATION_MESSAGE, mmsg, wallet)

        if (!result || result.failures) console.log(result)

    }

    return (
        <div key={hash} className={`bg-base-200 border border-neutral rounded-xl p-3 my-2 focus:shadow-md hover:shadow-md hover:-mx-3 hover:transition-all ${msg.answered && "opacity-60 bg-success text-success-content"}  ${msg.moderated && "ml-10 opacity-60 bg-error text-error-content"} hover:opacity-100`}>
        <div className="text-left">
            <ReactMarkdown children={msg.question} />
        </div>
        { msg.answer && <div className="text-right pl-2 mb-2 font-bold border-t border-white"> <ReactMarkdown children={msg.answer!} /></div>}
        <div className={`text-right text-sm flex gap-x-2 justify-end items-center`}>
            {isOwner && !msg.answered && !msg.moderated &&
                <div>
                    <button className="btn btn-sm btn-neutral mx-1" onClick={() => {
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
                                <button className="btn btn-sm m-1" onClick={() => publishAnswer({question: msg.question, timestamp: msg.timestamp}, answer)}>Submit</button>
                                <button className="btn btn-sm m-1">Close</button>
                            </form>
                            </div>
                        </div>
                    </dialog>
                </div>
            }
            {
                isOwner && moderation && !msg.answered &&
                    <div>
                        <button className="btn btn-sm btn-neutral m-1" onClick={() => moderate({question: msg.question, timestamp: msg.timestamp}, !msg.moderated)}>{msg.moderated ? "Show" : "Hide"}</button> 
                    </div>
            }
            <div className="font-bold items-center flex">
                {!isOwner && !msg.answered && !msg.upvotedByMe &&
                    <span className="items-center cursor-pointer m-1 hover:bg-primary p-1 hover:rounded-lg" onClick={() => upvote({question: msg.question, timestamp: msg.timestamp})}>
                        <PiThumbsUpLight size={25} className="" />
                    </span>
                } 
                <span className={`bg-primary border rounded-md p-1 text-primary-content border-primary ${msg.answered && "bg-primary"}`}>{msg.upvotes}</span>
            </div>
            <div className="bg-primary border rounded-md p-1 text-primary-content border-primary">
                {`${formatter.format(d)}`}
            </div>
        </div>
        
    </div>
    )
}


export default Question;
