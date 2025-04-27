import { sha256 } from "js-sha256"
import { ControlMessage, QuestionMessage } from "./types"

export const qaHash = (title: string, ts:number, owner: string) => {
    return sha256(title + ts + owner).slice(0, 12)
}

export const questionHash = (qm:QuestionMessage):string => {
    return sha256(JSON.stringify(qm))
}

export const isQAEnabled = (controlState: ControlMessage | undefined): boolean => {
    if (!controlState) throw new Error("control state: undefined")
    if (!controlState.enabled) return false
    if (controlState.startDate > Date.now()) return false
    if (controlState.endDate && controlState.endDate < Date.now()) return false

    return true

}