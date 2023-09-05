import { sha256 } from "js-sha256"

export type QuestionMessage = {
    question: string;
    timestamp: Date;
}


export type ControlMessage = {
    title: string;
    id: string;
    enabled: boolean;
    timestamp: Date;
    signer: string;
    signature: string | undefined
}

export const unique = <T>(msgs: T[]): T[] => {
    var distinct_hashes:string[] = []

    return msgs.filter((v) => {
        console.log(distinct_hashes)
        console.log(v)
        if (!v) return false
        const hash = sha256(JSON.stringify(v))
        if (distinct_hashes.indexOf(hash) < 0) {
            distinct_hashes.push(hash)
            return true
        }

        return false
    })
}