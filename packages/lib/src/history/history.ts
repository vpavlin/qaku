import { HistoryEntry, HistoryEvents, HistoryTypes } from "./types.js";
import { EventEmitter } from "eventemitter3";


const HISTORY_STORAGE_KEY = "qaku:history"

export class History extends EventEmitter {
    history:HistoryEntry[] = []
    constructor() {
        super()
        this.load()
    }

    public load() {
        const history = localStorage.getItem(HISTORY_STORAGE_KEY)
        if (history) {
            this.history = JSON.parse(history)
            this.emit(HistoryEvents.LOADED, {})
        }
    }

    public store() {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history))
        this.emit(HistoryEvents.STORED, {})
    }

    public getAll(type?: HistoryTypes): HistoryEntry[] {
        if (type) {
            return this.history.filter(e => e.type == type)
        }

        return this.history
    }

    public add(id: string, type: HistoryTypes, password?: string, title?: string, createdAt?: number, isActive?: boolean, description?: string) {
        if (this.get(id)) {
            throw new Error("History entry already exists")
        }
        this.history.push({id, title, type, password, createdAt: createdAt ? createdAt : Date.now(), isActive: isActive !== undefined ? isActive : false, questionsCnt: 0, pollsCnt: 0, description})
    }

    public update(entry: HistoryEntry) {
        const storedEntry = this.get(entry.id)
        if (!storedEntry) {
            throw new Error("Entry does not exist")
        }

        if (entry.type && storedEntry.type != HistoryTypes.CREATED)
            storedEntry.type = entry.type 
        
        if (entry.title)
            storedEntry.title = entry.title

        storedEntry.createdAt = entry.createdAt
        storedEntry.description = entry.description
        storedEntry.isActive = entry.isActive
        if (entry.questionsCnt > storedEntry.questionsCnt)
            storedEntry.questionsCnt = entry.questionsCnt

        if (entry.pollsCnt > entry.pollsCnt)
            storedEntry.pollsCnt = entry.pollsCnt
        this.store()
    }

    public incQuestionCnt(id: string) {
        const storedEntry = this.get(id)
        if (!storedEntry) {
            throw new Error("Entry does not exist")
        }

        if (!storedEntry.questionsCnt) storedEntry.questionsCnt = 0
        storedEntry.questionsCnt++
        this.store()
    }

    public incPollCnt(id: string) {
        const storedEntry = this.get(id)
        if (!storedEntry) {
            throw new Error("Entry does not exist")
        }

        if (!storedEntry.pollsCnt) storedEntry.pollsCnt = 0
        storedEntry.pollsCnt++
        this.store()
    }

    public setActive(id: string, isActive: boolean) {
        const storedEntry = this.get(id)
        if (!storedEntry) {
            throw new Error("Entry does not exist")
        }
        storedEntry.isActive = isActive
        this.store()
    }
    public updateMetadata(id: string, title: string, description?: string, createdAt?: number) {
        const storedEntry = this.get(id)
        if (!storedEntry) {
            throw new Error("Entry does not exist")
        }
        storedEntry.title = title 
        if (description) storedEntry.description = description
        if (createdAt) storedEntry.createdAt = createdAt
        this.store()
    }

    public updateType(id: string, type: HistoryTypes) {
        const storedEntry = this.get(id)
        if (!storedEntry) {
            throw new Error("Entry does not exist")
        }

        if (storedEntry.type != HistoryTypes.CREATED && storedEntry.type != HistoryTypes.ADMIN)
            storedEntry.type = type 

        this.store()
    }

    public delete(id: string) {
        const i = this.history.findIndex(h => h.id == id)
        if (i < 0) {
            throw new Error(`Entry ${id} not found`)
        }

        this.history.splice(i, 1)
        this.store()
    }


    public get(id: string):HistoryEntry | null {
        const i = this.history.findIndex(h => h.id == id)

        if (i < 0) {
            return null
        }

        return this.history[i]
    }
}