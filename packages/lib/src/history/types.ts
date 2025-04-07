export enum HistoryEvents {
    LOADED = "history:loaded",
    STORED = "history:stored",
    ADDED = "history:added",
    UPDATED = "history:updated",
    DELETED = "history:deleted"
}

export enum HistoryTypes {
    CREATED = "created",
    ADMIN = "admin",
    VISITED = "visited",
    PARTICIPATED = "participated"
}

export type HistoryEntry = {
    id: string;
    password?: string;
    title?: string;
    type?: HistoryTypes;
    isActive: boolean;
    description?: string;
    questionsCnt: number;
    pollsCnt: number;
    createdAt: number;
}

