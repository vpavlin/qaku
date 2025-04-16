import { sha256 } from "js-sha256"
import { QuestionMessage } from "./types"

export const qaHash = (title: string, ts:number, owner: string) => {
    return sha256(title + ts + owner).slice(0, 12)
}

export const questionHash = (qm:QuestionMessage):string => {
    return sha256(JSON.stringify(qm))
}
