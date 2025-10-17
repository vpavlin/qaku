import { AnswerType, UpvoteType } from "qakulib";
import { ThumbsUp, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useQakuContext } from "../hooks/useQaku";
import { shortAddr } from "../utils/crypto";
import { useEffect, useState } from "react";

interface iProps {
    questionId: string
    data: AnswerType
    upvote: (id: string, type: UpvoteType, questionId: string) => void
}

const Answer = ({questionId, data, upvote}: iProps) => {
    const {qaku, controlState} = useQakuContext()
    const [name, setName] = useState<string>()

    useEffect(() => {
        if (!name && data.delegationInfo && qaku) {
            qaku.externalWallet?.getName(data.delegationInfo.externalAddress)
                .then(name => setName(name || shortAddr(data.delegationInfo!.externalAddress)))
                .catch(e => setName(shortAddr(data.author)))
        }
    }, [data.delegationInfo, qaku, name, data.author])

    const isOwner = controlState?.owner === data.author
    const isAdmin = controlState?.admins.includes(data.author!)
    const hasLiked = qaku && qaku.identity && data.likers.find(l => l === qaku.identity!.address())

    return (
        <div className="bg-background/50 rounded-lg p-4 space-y-3">
            {/* Answer Content */}
            <div className="prose prose-sm max-w-none text-foreground">
                <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>

            {/* Answer Footer */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>
                        {isOwner && <span className="text-primary font-medium">Owner: </span>}
                        {isAdmin && !isOwner && <span className="text-accent font-medium">Admin: </span>}
                        <span className="font-medium">
                            {data.delegationInfo ? name : shortAddr(data.author!)}
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {qaku && qaku.identity && !hasLiked && (
                        <button 
                            onClick={() => upvote(data.id, UpvoteType.ANSWER, questionId)}
                            className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-accent/20 hover:text-accent rounded-md transition-colors"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="font-semibold">{data.likesCount}</span>
                        </button>
                    )}
                    {hasLiked && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/20 text-accent rounded-md">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="font-semibold">{data.likesCount}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Answer;