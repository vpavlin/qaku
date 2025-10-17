import { ThumbsUp, User, MessageSquare, Clock } from "lucide-react";
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

    const { controlState, isOwner, qaku , isAdmin, externalAddr} = useQakuContext()

    const d = new Date(msg.timestamp)
    const formatter = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric',  });

    const publishAnswer =  async (answer?: string) => {
        if (!qaku || !controlState) return

        let ext = useExternal

        if (!externalAddr) ext = false
        console.log("External add: ", externalAddr)

        const result = await qaku.answer(id, msg.hash, ext, answer)
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



    const statusStyles = msg.answers.length > 0 
        ? "border-l-2 border-l-success/40 bg-success/5" 
        : msg.moderated 
        ? "border-l-2 border-l-error/40 bg-error/5 opacity-75" 
        : "border-l-2 border-l-base-300";

    return (
        <div key={msg.hash} className={`group bg-base-200/30 backdrop-blur-sm rounded-lg border border-base-300/50 p-5 my-3 transition-all duration-200 hover:shadow-md hover:border-base-300 hover:bg-base-200/50 ${statusStyles}`}>
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                        {msg.delegationInfo ? name : 
                         msg.author ? `${msg.author}${msg.signer ? ` (${shortAddr(msg.signer)})` : ''}` : 
                         'Anonymous'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <Clock className="w-4 h-4" />
                    <time>{formatter.format(d)}</time>
                </div>
            </div>

            {/* Question Content */}
            <div className="prose prose-sm max-w-none mb-4 text-base-content text-left">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>

            {/* Answers Section */}
            {msg.answers.length > 0 && (
                <div className="space-y-2 mb-4 pl-4 border-l border-success/20">
                    {msg.answers
                        .sort((a: any, b: any) => b.timestamp - a.timestamp)
                        .sort((a: any, b: any) => b.likesCount - a.likesCount)
                        .map((a: any) => (
                            <Answer key={a.hash} data={a} questionId={msg.hash} upvote={upvote} />
                        ))
                    }
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-base-300">
                <div className="flex items-center gap-2">
                    {/* Upvote Button */}
                    {!isOwner && !msg.upvotedByMe && !msg.moderated && (
                        <button 
                            onClick={() => upvote(msg.hash, UpvoteType.QUESTION)}
                            className="btn btn-sm btn-ghost gap-2 hover:btn-primary"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-semibold">{msg.upvotes}</span>
                        </button>
                    )}
                    {(isOwner || msg.upvotedByMe) && (
                        <div className="badge badge-primary gap-2">
                            <ThumbsUp className="w-3 h-3" />
                            {msg.upvotes}
                        </div>
                    )}

                    {/* Answer Count Badge */}
                    {msg.answers.length > 0 && (
                        <div className="badge badge-success gap-2">
                            <MessageSquare className="w-3 h-3" />
                            {msg.answers.length} {msg.answers.length === 1 ? 'Answer' : 'Answers'}
                        </div>
                    )}
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2">
                    {(isOwner || isAdmin) && !msg.moderated && (
                        <>
                            <button 
                                className="btn btn-sm btn-outline gap-2"
                                onClick={() => {
                                    setAnswer("");
                                    (document.getElementsByClassName('answer_modal_'+msg.hash)[0] as HTMLDialogElement).showModal();
                                }}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Answer
                            </button>

                            <dialog className={`modal answer_modal_${msg.hash}`}>
                                <div className="modal-box max-w-2xl">
                                    <h3 className="font-bold text-lg mb-4">Answer Question</h3>
                                    <div className="prose prose-sm mb-4 p-4 bg-base-200 rounded-lg">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                    <label className="form-control">
                                        <div className="label">
                                            <span className="label-text font-semibold">Your Answer</span>
                                        </div>
                                        <textarea 
                                            onChange={(e) => setAnswer(e.target.value)} 
                                            value={answer} 
                                            className="textarea textarea-bordered h-32 w-full"
                                            placeholder="Type your answer here..."
                                        />
                                    </label>
                                    <div className="modal-action">
                                        <form method="dialog" className="flex gap-2">
                                            <button className="btn btn-primary" onClick={() => publishAnswer(answer)}>
                                                Submit Answer
                                            </button>
                                            <button className="btn btn-ghost">Cancel</button>
                                        </form>
                                    </div>
                                </div>
                                <form method="dialog" className="modal-backdrop">
                                    <button>close</button>
                                </form>
                            </dialog>
                        </>
                    )}

                    {isOwner && moderation && (
                        <button 
                            className="btn btn-sm btn-outline btn-error"
                            onClick={() => moderate(!msg.moderated)}
                        >
                            {msg.moderated ? 'Show' : 'Hide'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}


export default Question;
