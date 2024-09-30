import { DecodedMessage, bytesToUtf8 } from "@waku/sdk";
import { sha256 } from "js-sha256"
import { fromHex, verifyMessage } from "./crypto";

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
    POLL_ACTIVE_MESSAGE = "poll_active_msg"
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
    timestamp: Date;
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