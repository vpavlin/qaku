import { useState } from "react";
import { useQakuContext } from "../../hooks/useQaku";
import { useToastContext } from "../../hooks/useToast";
import { Id, LocalPoll, PollVoter } from "qakulib";

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
        if (!qaku! || !qaku.identity || (!isOwner && !isAdmin) ) return
        setSubmitting(true)
        const res = await qaku.pollActive(id, pollId, newState)
        setSubmitting(false)
        if (!res) {
            error("Failed to switch poll state")
            return
        }
        info(`Switched poll to ${newState ? "enabled" : "disabled"}`)

    }

    return (<div>
        {
            polls.map((p:LocalPoll) => {
            let alreadyVoted = false
            let max = -1
            let maxI = -1

            if (qaku?.identity && p.votes)
                p.votes.map((o:PollVoter, i) => {
                    alreadyVoted = alreadyVoted || o.voters.indexOf(qaku?.identity?.address()!) >= 0
                    if (o.voters.length > max) {
                        maxI = i
                        max = o.voters.length
                    }
                })

            
            return <div className={`bg-neutral p-3 my-2 shadow-md`}>
                {(isOwner || isAdmin)  && <div className="text-left lg:text-center">
                        <button className="btn btn-xs" disabled={!qaku?.dispatcher || !qaku.identity || submitting} onClick={() => handleActiveSwitch(p.id, !p.active)}>{p.active ? "Deactivate" : "Activate"}</button>
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
                    p.options.map((o, i) =>  o.title != "" &&
                            <div className="flex flex-row items-center justify-between space-y-2 bg-base-100 p-1 ">
                                <div className={`tooltip w-1/2 ${ i == maxI ? "tooltip-secondary" : "tooltip-primary"}`} data-tip={p.votes ? p.votes[i].voters.length : 0}>
                                    <progress className={`progress ${ i == maxI ? "progress-secondary" : "progress-primary"}`} value={p.votes ? p.votes[i].voters.length : 0} title={p.votes ? p.votes[i].voters.length.toString() : "0"} max={p.voteCount || 0}></progress>
                                </div>

                                <div className="w-1/2"><button className="btn w-11/12" disabled={!qaku?.dispatcher || !qaku.identity || submitting || !p.active || alreadyVoted} onClick={() => handleVote(p.id, i)}>{o.title}</button></div>
                            </div>
                    )
                }
                </div>
            </div>})
        }
    </div>)
}

export default Polls;