export type PollOption = {
    title: string
}

export type Poll = {
    id: string
    title?: string
    question: string
    options: PollOption[]
    activeUntil?: Date
    active: boolean
}

export type LocalPoll = Poll & {
    votes?: PollVoter[]
    voteCount?: number
    owner: string
} 

export type PollVoter = {
    voters: string []
}

export type NewPoll = {
    creator: string
    poll: Poll
    timestamp: number
}

export type PollActive = {
    id: string
    active: boolean
}

export type PollVote = {
    id: string
    option: number
}