import { PiThumbsUpLight, PiUser } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import { shortAddr } from "../utils/crypto";
import { EnhancedQuestionMessage, Id, UpvoteType } from "qakulib";
import Answer from "./answer";

interface IProps {
    id: Id
    msg: EnhancedQuestionMessage
    moderation: boolean
}

const Question = ({id, msg, moderation}:IProps) => {
    const [ answer, setAnswer ] = useState<string>()
    const { error, info } = useToastContext()
    const [ useExternal, setuseExternal] = useState(true)
    const [ name, setName] = useState<string>()

    const { controlState, isOwner, qaku , isAdmin} = useQakuContext()

    const d = new Date(msg.timestamp)
    const formatter = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric',  });

    const publishAnswer =  async (answer?: string) => {
        if (!qaku || !controlState) return

        const result = await qaku.answer(id, msg.hash, false, answer)
        if (!result) {
            console.log("Failed to answer")
            error("Failed to publish answer")
            return
        }
        info("Published an answer")
    }

    const upvote = async (hash: string, type: UpvoteType, questionId?: string) => {
        if (!qaku || !controlState) return
        
        const result = await qaku.upvote(id, hash, type, false, questionId)
        if (!result) {
            console.log("Failed to upvote")
            error("Failed to publish upvote")
            return
        }

        info("Upvoted!")

    }

    const moderate = async (moderated:boolean) => {
        if (!qaku || !controlState) return

       const result = await qaku.moderate(id, msg.hash, moderated)

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

    if (!name && qaku && qaku.externalWallet && msg.delegationInfo) {
        qaku?.externalWallet?.getName(msg.delegationInfo.externalAddress).then((name) => name && setName(name)).catch(e => setName(shortAddr(msg.signer!)))
    }



    return (
        <div key={msg.hash} className={`flex flex-col bg-base-200 border border-neutral rounded-xl p-3 my-2 focus:shadow-md hover:shadow-md hover:-mx-3 hover:transition-all ${msg.answers.length > 0 && "opacity-60 bg-success text-success-content"}  ${msg.moderated && "ml-10 opacity-60 bg-error text-error-content"} hover:opacity-100`}>
        <div className="text-left flex-row">
            <ReactMarkdown children={msg.content} />
            <div className="text-right items-end">{msg.delegationInfo ?
                    <span><PiUser className="inline-block" /> {name}</span>
                    :
                    msg.author && <span><PiUser className="inline-block" /> {msg.author} {msg.signer && `(${shortAddr(msg.signer)})`}</span>
                }
                </div>
            
        </div>
        <div className="flex-row  items-end justify-end">
        { msg.answers.length > 0 && msg.answers.sort((a, b) => b.timestamp - a.timestamp).sort((a, b) => b.likesCount - a.likesCount).map(a => <Answer data={a} questionId={msg.hash} upvote={upvote} />)
        }
        </div>
        <div className={`text-right text-sm flex gap-x-2 justify-end items-center`}>
            {(isOwner || isAdmin) && !msg.moderated &&
                <div>
                    <button className="btn btn-sm btn-neutral mx-1" onClick={() => {
                        setAnswer("");
                        (document.getElementsByClassName('answer_modal_'+msg.hash)[0] as HTMLDialogElement).showModal()
                        }}>Answer</button>
                    <dialog className={`modal answer_modal_${msg.hash}`}>
                        <div className="modal-box text-left">
                            <div className="text-left m-2"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            <div className="font-bold m-1">Answer</div>
                            <textarea onChange={(e) => setAnswer(e.target.value)} value={answer} className="textarea textarea-bordered w-full h-44 m-auto mb-1"></textarea>
                            <div className="modal-action">
                            <form method="dialog">
                                <button className="btn btn-sm m-1" onClick={() => publishAnswer(answer)}>Submit</button>
                                <button className="btn btn-sm m-1">Close</button>
                            </form>
                            </div>
                        </div>
                    </dialog>
                </div>
            }
            {
                isOwner && moderation &&
                    <div>
                        <button className="btn btn-sm btn-neutral m-1" onClick={() => moderate(!msg.moderated)}>{msg.moderated ? "Show" : "Hide"}</button> 
                    </div>
            }
            <div className="font-bold items-center flex">
                {!isOwner && !msg.upvotedByMe && !msg.moderated &&
                    <span className="items-center cursor-pointer m-1 hover:bg-primary p-1 hover:rounded-lg" onClick={() => upvote(msg.hash, UpvoteType.QUESTION)}>
                        <PiThumbsUpLight size={25} className="" />
                    </span>
                } 
                <span className={`bg-primary border rounded-md p-1 text-primary-content border-primary ${msg.answers.length > 0 && "bg-primary"}`}>{msg.upvotes}</span>
            </div>
            <div className="bg-primary border rounded-md p-1 text-primary-content border-primary">
                {`${formatter.format(d)}`}
            </div>
        </div>
        
    </div>
    )
}


export default Question;
