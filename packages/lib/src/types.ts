import { sha256 } from "js-sha256"
import { Dispatcher } from "waku-dispatcher"
import { DelegationInfo } from "./external_wallet/external_wallet"

export type QuestionList = Map<string, EnhancedQuestionMessage>
export type Id = string
export type QAList = Map<Id, QAType>

export type QAType = {
    dispatcher:Dispatcher | null
    controlState:ControlMessage | undefined
    questions:QuestionList;
    polls:LocalPoll[];
}

export enum QakuEvents {
    NEW_CONTROL_MESSAGE = "newControlMessage",
    NEW_QUESTION = "newQuestion",
    NEW_QUESTION_PUBLISHED = "newQuestionPublished",
    NEW_UPVOTE = "newUpvote",
    NEW_UPVOTE_PUBLISHED = "newUpvotePublished",
    NEW_ANSWER = "newAnswer",
    NEW_ANSWER_PUBLISHED = "newAnswerPublished",
    NEW_MODERATION = "newModeration",
    NEW_MODERATION_PUBLISHED = "newModerationPublished",
    QA_CLOSED = "qaClosed",
    QA_OPENED = "qaOpened",
    NEW_POLL = "newPoll",
    NEW_POLL_PUBLISHED = "newPollPublished",
    NEW_POLL_VOTE = "newPollVote",
    POLL_STATE_CHANGE = "pollStateChange",
    QAKU_STATE_UPDATE = "qakuStateUpdate",
    QAKU_CONTENT_CHANGED = "qakuContentChanged",
}

export enum QakuState {
    UNDEFINED = "undefined",
    INITIALIZING = "initializing",
    INIT_PROTOCOL = "initializing_protocol",
    INIT_IDENTITY = "initalizing_identity",
    INITIALIZED = "initialized",
    FAILED = "failed"
}

export enum QuestionSort {
    TIME_DESC = "time_desc",
    TIME_ASC = "time_asc",
    UPVOTES_DESC = "upvotes_desc",
    UPVOTES_ASC = "upvotes_asc",
    ANSWERED_ASC = "answered_asc",
    ANSWERED_DESC = "answered_desc",
}

export enum QuestionShow {
    ALL = "all",
    ANSWERED = "answered",
    UNANSWERED = "unanswered",
    MODERATED = "moderated"
}

export type QuestionMessage = {
    question: string;
    timestamp: Date;
    author?: string;
    delegationInfo?: DelegationInfo;
}

export type ActivityMessage = {
    pubKey: string;
}

export enum MessageType {
    CONTROL_MESSAGE = "control_msg",
    QUESTION_MESSAGE = "question_msg",
    ANSWER_MESSAGE = "answer_msg",
    ANSWERED_MESSAGE = "answered_msg",
    UPVOTE_MESSAGE = "upvote_msg",
    MODERATION_MESSAGE = "moderation_msg",
    POLL_CREATE_MESSAGE = "poll_create_msg",
    POLL_VOTE_MESSAGE = "poll_vote_msg",
    POLL_ACTIVE_MESSAGE = "poll_active_msg",
    SNAPSHOT = "snapshot",

    PERSIST_SNAPSHOT = "persist_snapshot",
}

export enum UpvoteType {
    ANSWER = "answer",
    QUESTION = "question"
}

export type UpvoteMessage = {
    questionId: string | undefined;
    hash: string;
    type: UpvoteType;
    timestamp: number;
    delegationInfo?: DelegationInfo;
}

export type AnsweredMessage = {
    hash: string;
    text: string | undefined
    timestamp: number
    delegationInfo?: DelegationInfo;
}

export type ModerationMessage = {
    hash: string;
    moderated: boolean;
}

export type ControlMessage = {
    title: string;
    id: string;
    enabled: boolean;
    timestamp: number;
    owner: string;
    admins: string[];
    moderation: boolean;
    description: string;
    updated: number;
    startDate: number;
    endDate?: number;
    allowsParticipantsReplies: boolean;
    delegationInfo?: DelegationInfo;
}

export type EnhancedQuestionMessage = {
    qaId: Id;
    hash: string;
    content: string;
    timestamp: Date;
    answers: AnswerType[]
    upvotes: number;
    upvoters: string[]
    upvotedByMe: boolean;
    moderated: boolean;
    signer: string | undefined
    author?: string;
    delegationInfo?: DelegationInfo;
}

export type BaseMessageType = {
    id: string
    timestamp: number
    content: string
    author: string
    likesCount: number
    likers: string[]
    delegationInfo?: DelegationInfo;
}

export type AnswerType = BaseMessageType & {
    questionId: string
    qnaId: string
}

export type QakuHash = {
    hash: string;
}

export type QakuHashList = {
    hashes: string[];
}

export const unique = <T>(msgs: T[]): T[] => {
    var distinct_hashes:string[] = []

    return msgs.filter((v) => {
        if (!v) return false
        const hash = sha256(JSON.stringify(v))
        if (distinct_hashes.indexOf(hash) < 0) {
            distinct_hashes.push(hash)
            return true
        }

        return false
    })
}

export type DownloadSnapshot = {
    metadata: ControlMessage;
    questions: EnhancedQuestionMessage[];
    polls: LocalPoll[];
    signature: string;
}


export type LocalPoll = Poll & {
    votes?: PollVoter[]
    voteCount?: number
    owner: string
    delegationInfo?: DelegationInfo;
} 

export type NewPoll = {
    creator: string
    poll: Poll
    timestamp: number
    delegationInfo?: DelegationInfo;
}

export type PollOption = {
    title: string
}

export type PollVoter = {
    voters: string []
}

export type PollActive = {
    id: string
    active: boolean
}

export type PollVote = {
    id: string
    option: number
    delegationInfo?: DelegationInfo;
}

export type Poll = {
    id: string
    title?: string
    question: string
    options: PollOption[]
    activeUntil?: Date
    active: boolean
}

// @ts-ignore
export const replacer = (key: any, value: any) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}

// @ts-ignore
export const reviver = (key: any, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}
