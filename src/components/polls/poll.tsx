import { useState } from "react";
import { useQakuContext } from "../../hooks/useQaku";
import { useToastContext } from "../../hooks/useToast";
import { Id, LocalPoll, PollVoter } from "qakulib";
import { BarChart2, CheckCircle2, Power } from "lucide-react";

interface IProps {
    id: Id
}

const Polls = ({id}: IProps) => {
    const {polls, qaku, isOwner, isAdmin} = useQakuContext()
    const [submitting, setSubmitting] = useState(false)
    const {info, error} = useToastContext()

    const handleVote = async (pollId: string, option: number) => {
        if (!qaku || !qaku.identity) return
        setSubmitting(true)

        const res = await qaku.pollVote(id, pollId, option)
        setSubmitting(false)
        if (!res) {
            error("Failed to publish a vote")
            return
        }
        info("Submitted a vote")
    }

    const handleActiveSwitch = async (pollId: string, newState: boolean) => {
        if (!qaku! || !qaku.identity || (!isOwner && !isAdmin)) return
        setSubmitting(true)
        const res = await qaku.pollActive(id, pollId, newState)
        setSubmitting(false)
        if (!res) {
            error("Failed to switch poll state")
            return
        }
        info(`Poll ${newState ? "activated" : "deactivated"}`)
    }

    if (polls.length === 0) {
        return (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
                <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                    No polls yet
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {polls.map((p: LocalPoll) => {
                let alreadyVoted = false
                let max = -1
                let maxI = -1
                let totalVotes = p.voteCount || 0

                if (qaku?.identity && p.votes) {
                    p.votes.forEach((o: PollVoter, i) => {
                        alreadyVoted = alreadyVoted || o.voters.indexOf(qaku?.identity?.address()!) >= 0
                        if (o.voters.length > max) {
                            maxI = i
                            max = o.voters.length
                        }
                    })
                }

                return (
                    <div 
                        key={p.id}
                        className="bg-card border border-border rounded-xl p-6 space-y-4"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                {p.title && (
                                    <h3 className="text-lg font-bold">{p.title}</h3>
                                )}
                                <p className="text-foreground">{p.question}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                        p.active 
                                            ? 'bg-accent/20 text-accent' 
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {p.active ? 'Active' : 'Closed'}
                                    </span>
                                    {alreadyVoted && (
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary rounded-lg text-xs font-medium">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Voted
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                                </span>
                            </div>
                        </div>

                        {/* Admin Controls */}
                        {(isOwner || isAdmin) && (
                            <div className="flex justify-end">
                                <button 
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        p.active
                                            ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
                                            : 'bg-accent/10 hover:bg-accent/20 text-accent'
                                    }`}
                                    disabled={!qaku?.dispatcher || !qaku.identity || submitting}
                                    onClick={() => handleActiveSwitch(p.id, !p.active)}
                                >
                                    <Power className="w-4 h-4" />
                                    {p.active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-3">
                            {p.options.map((o, i) => {
                                if (o.title === "") return null
                                
                                const votes = p.votes ? p.votes[i].voters.length : 0
                                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
                                const isWinning = i === maxI && totalVotes > 0

                                return (
                                    <div key={i} className="space-y-2">
                                        {/* Option with vote button */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                className={`flex-1 px-4 py-3 rounded-lg font-medium text-left transition-all ${
                                                    !p.active || alreadyVoted || !qaku?.identity
                                                        ? 'bg-secondary/50 cursor-not-allowed'
                                                        : 'bg-secondary hover:bg-primary hover:text-primary-foreground'
                                                }`}
                                                disabled={!qaku?.dispatcher || !qaku.identity || submitting || !p.active || alreadyVoted}
                                                onClick={() => handleVote(p.id, i)}
                                            >
                                                {o.title}
                                            </button>
                                            <span className="text-sm font-semibold text-muted-foreground min-w-[40px] text-right">
                                                {votes}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="relative h-2 bg-secondary/30 rounded-full overflow-hidden">
                                            <div 
                                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                                    isWinning ? 'bg-primary' : 'bg-accent'
                                                }`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        {/* Percentage */}
                                        <div className="text-xs text-muted-foreground text-right">
                                            {percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default Polls;
