import { useEffect, useState } from "react";
import { useQakuContext } from "../../hooks/useQaku";
import { MessageType } from "../../utils/messages";
import { NewPoll, Poll, PollActive, PollVote } from "./types";
import { DispatchMetadata, Signer } from "waku-dispatcher";

const Polls = () => {
    const {polls, dispatcher, wallet, isOwner, isAdmin} = useQakuContext()
    const [submitting, setSubmitting] = useState(false)
   

    const handleVote = async (pollId: string, option: number) => {
        if (!dispatcher || !wallet) return
        setSubmitting(true)
        const res = await dispatcher.emit(MessageType.POLL_VOTE_MESSAGE, {id: pollId, option: option} as PollVote, wallet)

        setSubmitting(false)
    }

    const handleActiveSwitch = async (pollId: string, newState: boolean) => {
        if (!dispatcher || !wallet || (!isOwner && !isAdmin) ) return
        setSubmitting(true)
        const res = await dispatcher.emit(MessageType.POLL_ACTIVE_MESSAGE, {id: pollId, active: newState} as PollActive, wallet)
        setSubmitting(false)

    }

    return (<div>
        {
            polls.map((p) => {
            let alreadyVoted = false
            let max = -1
            let maxI = -1

            if (wallet && p.votes)
                p.votes.map((o, i) => {
                    alreadyVoted = alreadyVoted || o.voters.indexOf(wallet.address) >= 0
                    if (o.voters.length > max) {
                        maxI = i
                        max = o.voters.length
                    }
                })

            
            return <div className={`bg-neutral p-3 my-2 shadow-md`}>
                {(isOwner || isAdmin)  && <div className="text-left lg:text-center">
                        <button className="btn btn-xs" disabled={!dispatcher || !wallet || submitting} onClick={() => handleActiveSwitch(p.id, !p.active)}>{p.active ? "Deactivate" : "Activate"}</button>
                    </div>
                }
                <div className="lg:flex lg:flex-row justify-end relative">
                    <div className="space-x-2 lg:absolute right-0">
                        <div className="badge">{p.active ? "active" : "inactive"}</div>
                        <div className="badge">{p.voteCount || 0} votes</div>
                        {alreadyVoted && <div className="badge badge-primary">voted</div>}
                    </div>
                    <div className="text-lg font-bold w-full lg:min-h-[1.5rem]">{p.title}</div>
                </div>
                <div className="p-1">{p.question}</div>
                <div className="space-y-1">
                {
                    p.options.map((o, i) =>  
                            <div className="flex flex-row items-center justify-between space-y-2 bg-base-100 p-1 ">
                                <div className={`tooltip w-1/2 ${ i == maxI ? "tooltip-secondary" : "tooltip-primary"}`} data-tip={p.votes ? p.votes[i].voters.length : 0}>
                                    <progress className={`progress ${ i == maxI ? "progress-secondary" : "progress-primary"}`} value={p.votes ? p.votes[i].voters.length : 0} title={p.votes ? p.votes[i].voters.length.toString() : "0"} max={p.voteCount || 0}></progress>
                                </div>

                                <div className="w-1/2"><button className="btn w-11/12" disabled={!dispatcher || !wallet || submitting || !p.active || alreadyVoted} onClick={() => handleVote(p.id, i)}>{o.title}</button></div>
                            </div>
                    )
                }
                </div>
            </div>})
        }
    </div>)
}

export default Polls;