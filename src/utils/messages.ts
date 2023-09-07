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
    SEEN_MESSAGE = "seen_msg",
    QUESTION_MESSAGE = "question_msg",
    ANSWER_MESSAGE = "answer_msg",
    ANSWERED_MESSAGE = "answered_msg",
}

export type QakuMessage = {
    type: MessageType;
    payload: string;
    signer: string;
    signature: string | undefined;
}


export type AnsweredMessage = {
    hash: string;
}

export type ControlMessage = {
    title: string;
    id: string;
    enabled: boolean;
    timestamp: Date;
    owner: string;
    admins: string[];
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
    if (!verifyMessage(msg.payload, msg.signature, fromHex(msg.signer))) return

    return parsed
}

export const parseQuestionMessage = (msg: QakuMessage): QuestionMessage | undefined => {
    const parsed: QuestionMessage = JSON.parse(msg.payload)
    if (parsed.question == "") return
    if (!parsed.timestamp) return

    return parsed
}

export const parseAnsweredMessage = (msg: QakuMessage): AnsweredMessage | undefined => {
    const parsed: AnsweredMessage = JSON.parse(msg.payload)
    if (!parsed.hash || parsed.hash == "") return
    if (!msg.signature || msg.signature == "") return
    if (!verifyMessage(msg.payload, msg.signature, fromHex(msg.signer))) return
    
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