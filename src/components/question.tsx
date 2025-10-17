import { ThumbsUp, User, MessageSquare, Clock, Eye, EyeOff } from "lucide-react";
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
    const [ showAnswerModal, setShowAnswerModal ] = useState(false)

    const { controlState, isOwner, qaku , isAdmin, externalAddr} = useQakuContext()

    const d = new Date(msg.timestamp)
    const formatter = new Intl.DateTimeFormat('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric'
    });

    const publishAnswer = async (answer?: string) => {
        if (!qaku || !controlState) return

        let ext = useExternal
        if (!externalAddr) ext = false

        const result = await qaku.answer(id, msg.hash, ext, answer)
        if (!result) {
            error("Failed to publish answer")
            return
        }
        info("Published an answer")
        setShowAnswerModal(false)
        setAnswer("")
    }

    const upvote = async (hash: string, type: UpvoteType, questionId?: string) => {
        if (!qaku || !controlState) return
        
        const result = await qaku.upvote(id, hash, type, false, questionId)
        if (!result) {
            error("Failed to publish upvote")
            return
        }
        info("Upvoted!")
    }

    const moderate = async (moderated:boolean) => {
        if (!qaku || !controlState) return

       const result = await qaku.moderate(id, msg.hash, moderated)

        if (!result) { 
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
        qaku?.externalWallet?.getName(msg.delegationInfo.externalAddress)
            .then((name) => name && setName(name))
            .catch(e => setName(shortAddr(msg.signer!)))
    }

    const hasAnswers = msg.answers.length > 0
    const isModerated = msg.moderated

    return (
        <div 
            className={`bg-card border rounded-xl p-6 transition-all ${
                hasAnswers 
                    ? 'border-accent/40 bg-accent/5' 
                    : isModerated 
                    ? 'border-destructive/40 bg-destructive/5 opacity-75' 
                    : 'border-border hover:border-border/80'
            }`}
        >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                        {msg.delegationInfo ? name : 
                         msg.author ? `${msg.author}${msg.signer ? ` (${shortAddr(msg.signer)})` : ''}` : 
                         'Anonymous'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <time>{formatter.format(d)}</time>
                </div>
            </div>

            {/* Question Content */}
            <div className="prose prose-sm max-w-none mb-4 text-foreground">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>

            {/* Answers Section */}
            {hasAnswers && (
                <div className="space-y-3 mb-4 pl-4 border-l-2 border-accent/30">
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
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                    {/* Upvote Button */}
                    {!isOwner && !msg.upvotedByMe && !msg.moderated && (
                        <button 
                            onClick={() => upvote(msg.hash, UpvoteType.QUESTION)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-sm"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-semibold">{msg.upvotes}</span>
                        </button>
                    )}
                    {(isOwner || msg.upvotedByMe) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-semibold">{msg.upvotes}</span>
                        </div>
                    )}

                    {/* Answer Count Badge */}
                    {hasAnswers && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-sm">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-semibold">
                                {msg.answers.length} {msg.answers.length === 1 ? 'Answer' : 'Answers'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2">
                    {(isOwner || isAdmin) && !msg.moderated && (
                        <button 
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
                            onClick={() => setShowAnswerModal(true)}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Answer
                        </button>
                    )}

                    {isOwner && moderation && (
                        <button 
                            className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-sm font-medium"
                            onClick={() => moderate(!msg.moderated)}
                        >
                            {msg.moderated ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {msg.moderated ? 'Show' : 'Hide'}
                        </button>
                    )}
                </div>
            </div>

            {/* Answer Modal */}
            {showAnswerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 space-y-4">
                            <h3 className="text-xl font-bold">Answer Question</h3>
                            
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <div className="prose prose-sm max-w-none text-foreground">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Your Answer
                                </label>
                                <textarea 
                                    onChange={(e) => setAnswer(e.target.value)} 
                                    value={answer} 
                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-y"
                                    placeholder="Type your answer here..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                    onClick={() => publishAnswer(answer)}
                                >
                                    Submit Answer
                                </button>
                                <button 
                                    className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
                                    onClick={() => {
                                        setShowAnswerModal(false)
                                        setAnswer("")
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Question;
