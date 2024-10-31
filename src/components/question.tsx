import { sha256 } from "js-sha256";
import { AnsweredMessage, EnhancedQuestionMessage, MessageType, ModerationMessage, QakuMessage, QuestionMessage, UpvoteMessage } from "../utils/messages";
import { PiThumbsUpLight } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { useQakuContext } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import { shortAddr } from "../utils/crypto";

interface IProps {
    msg: EnhancedQuestionMessage
    moderation: boolean
}

const Question = ({msg, moderation}:IProps) => {
    const [ answer, setAnswer ] = useState<string>()
    const { error, info } = useToastContext()

    const { controlState, isOwner, dispatcher , wallet, isAdmin} = useQakuContext()

    const hash = sha256(JSON.stringify(msg))
    const d = new Date(msg.timestamp)
    const formatter = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric',  });

    const publishAnswer =  async (qmsg:QuestionMessage, answer?: string) => {
        if (!wallet || !dispatcher || !controlState) return

        console.log(qmsg)
        const hash = sha256(JSON.stringify(qmsg))
        const amsg:AnsweredMessage = { hash: hash, text: answer }
        const result = await dispatcher.emit(MessageType.ANSWERED_MESSAGE, amsg, wallet)

        if (!result) {
            console.log("Failed to answer")
            error("Failed to publish answer")
            return
        }
        info("Published an answer")
    }

    const upvote = async (qmsg: QuestionMessage) => {
        if (!wallet || !dispatcher || !controlState) return
        
        const hash = sha256(JSON.stringify(qmsg))
        const amsg:UpvoteMessage = {hash: hash}
        const result = await dispatcher.emit(MessageType.UPVOTE_MESSAGE, amsg, wallet)

        if (!result) {
            console.log("Failed to upvote")
            error("Failed to publish upvote")
            return
        }

        info("Upvoted!")

    }

    const moderate = async (qmsg:QuestionMessage, moderated:boolean) => {
        if (!wallet || !dispatcher || !controlState) return

        const hash = sha256(JSON.stringify(qmsg))
        const mmsg:ModerationMessage = {hash:hash, moderated: moderated}
        const result = await dispatcher.emit(MessageType.MODERATION_MESSAGE, mmsg, wallet)

        if (!result) { 
            console.log("Failed to moderate")
            error("Failed to publish moderation message")
            return
        }

        if (moderated) {
            info("Successfully set message to 'hidden'")
        } else {
            info("Successfully set message to 'shown'")
        }
    }

    return (
        <div key={hash} className={`bg-base-200 border border-neutral rounded-xl p-3 my-2 focus:shadow-md hover:shadow-md hover:-mx-3 hover:transition-all ${msg.answered && "opacity-60 bg-success text-success-content"}  ${msg.moderated && "ml-10 opacity-60 bg-error text-error-content"} hover:opacity-100`}>
        <div className="text-left">
            <ReactMarkdown children={msg.question} />
        </div>
        { msg.answer && <div className="text-right pl-2 mb-2 font-bold border-t border-white"> <ReactMarkdown children={msg.answer!} /> (answered by {controlState?.owner == msg.answeredBy && "owner: "}{controlState?.admins.includes(msg.answeredBy!) && "admin: "}{shortAddr(msg.answeredBy!)})</div>}
        <div className={`text-right text-sm flex gap-x-2 justify-end items-center`}>
            {(isOwner || isAdmin) && !msg.answered && !msg.moderated &&
                <div>
                    <button className="btn btn-sm btn-neutral mx-1" onClick={() => {
                        setAnswer("");
                        console.log(msg.question);
                        (document.getElementsByClassName('answer_modal_'+hash)[0] as HTMLDialogElement).showModal()
                        }}>Answer</button>
                    <dialog className={`modal answer_modal_${hash}`}>
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
                {!isOwner && !msg.answered && !msg.upvotedByMe && !msg.moderated &&
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
