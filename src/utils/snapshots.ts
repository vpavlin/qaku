import { StoreMsg } from "waku-dispatcher/dist/storage/store"

export const LOCAL_STORAGE_SNAPSHOT_KEY = "qaku:snapshots"

export type Snapshot = {
    cid:string,
    hash:string,
    timestamp: number,
}

export type PersistentSnapshot = {
    messages: StoreMsg[],
    owner: string,
    hash:string,
    //timestamp: number,
}

const load = () => {
    let snapshotsStr = localStorage.getItem(LOCAL_STORAGE_SNAPSHOT_KEY)
    if (!snapshotsStr) {
        snapshotsStr = "{}"
    }
    const snapshots = JSON.parse(snapshotsStr)  

    return snapshots
}


export const getStoredSnapshotInfo = (id:string) => {
    const snapshots = load()
    const snap:Snapshot | undefined = snapshots[id]

    return snap
}

export const setStoredSnapshotInfo = (id:string, snap:Snapshot) => {
    const snapshots = load()
    console.log(snap)

    snapshots[id] = snap
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(snapshots))
}