import { DecodedMessage, bytesToUtf8 } from "@waku/sdk";
import { sha256 } from "js-sha256"
import { fromHex, verifyMessage } from "./crypto";
import { LocalPoll } from "qakulib";

export type QuestionMessage = {
    question: string;
    timestamp: Date;
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

export type QakuMessage = {
    type: MessageType;
    payload: string;
    signer: string;
    signature: string | undefined;
}

export type UpvoteMessage = {
    hash: string;
}

export type AnsweredMessage = {
    hash: string;
    text: string | undefined
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
}

export type EnhancedQuestionMessage = {
    hash: string,
    question: string;
    timestamp: Date;
    answer: string | undefined;
    answered: boolean;
    answeredBy: string | undefined;
    upvotes: number;
    upvoters: string[]
    upvotedByMe: boolean;
    moderated: boolean;
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

export const qaHash = (title: string, ts:number, owner: string) => {
    return sha256(title + ts + owner).slice(0, 12)
}