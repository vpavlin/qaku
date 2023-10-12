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
    MODERATION_MESSAGE = "moderation_msg"
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

export const parseQakuMessage = (msg: DecodedMessage): QakuMessage | undefined => {
    const parsed:QakuMessage = JSON.parse(bytesToUtf8(msg.payload))

    if (!Object.values(MessageType).includes(parsed.type)) return
    if (!parsed.payload) return
    if (!parsed.signer || parsed.signer == "") return

    return parsed
}

export const parseControlMessage = (msg: QakuMessage): ControlMessage | undefined => {
    const parsed:ControlMessage = JSON.parse(msg.payload)

    if (parsed.title == "") return
    if (!msg.signature || msg.signature == "") return
    if (!verifyMessage(msg.payload, msg.signature, msg.signer)) return

    if (!parsed.description) parsed.description = ""

    return parsed
}

export const parseQuestionMessage = (msg: QakuMessage): QuestionMessage | undefined => {
    const parsed: QuestionMessage = JSON.parse(msg.payload)
    if (parsed.question == "") return
    if (!parsed.timestamp) return

    return parsed
}

export const parseUpvoteMessage = (msg: QakuMessage): UpvoteMessage | undefined => {
    const parsed: UpvoteMessage = JSON.parse(msg.payload)
    if (!parsed.hash || parsed.hash == "") return
    if (!msg.signature || msg.signature == "") return
    if (!verifyMessage(msg.payload, msg.signature, msg.signer)) return

    return parsed
}

export const parseAnsweredMessage = (msg: QakuMessage): AnsweredMessage | undefined => {
    const parsed: AnsweredMessage = JSON.parse(msg.payload)
    if (!parsed.hash || parsed.hash == "") return
    if (!msg.signature || msg.signature == "") return
    if (!verifyMessage(msg.payload, msg.signature, msg.signer)) return

    return parsed
}

export const parseModerationMessage = (msg: QakuMessage): ModerationMessage | undefined => {
    const parsed: ModerationMessage = JSON.parse(msg.payload)
    if (!parsed.hash || parsed.hash == "") return
    if (!msg.signature || msg.signature == "") return
    if (!verifyMessage(msg.payload, msg.signature, msg.signer)) return

    return parsed
}

export const parseMessage = (msg: DecodedMessage): QuestionMessage | ControlMessage | undefined => {
    const parsed = parseQakuMessage(msg)
    if (!parsed) return
    switch (parsed.type) {
        case MessageType.CONTROL_MESSAGE:
            return parseControlMessage(parsed)

        case MessageType.QUESTION_MESSAGE:
            return parseQuestionMessage(parsed);
        default:
            return;
    }
}

export type EnhancedQuestionMessage = {
    question: string;
    timestamp: Date;
    answer: string | undefined;
    answered: boolean;
    upvotes: number;
    upvotedByMe: boolean;
    moderated: boolean;
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