import { sha256 } from "js-sha256"
import { ControlMessage, EnhancedQuestionMessage, LocalPoll } from "qakulib";


export type ActivityMessage = {
    pubKey: string;
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