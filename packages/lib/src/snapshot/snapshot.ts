import { CodexOptions, DownloadSnapshot, PersistentSnapshot, Snapshot } from './types.js';
import { sha256 } from 'js-sha256';
import { ControlMessage, Id, MessageType, QAList } from '../types.js';
import { QakuCache } from './cache.js';
import { Codex } from '@codex-storage/sdk-js';
import { BrowserUploadStrategy } from '@codex-storage/sdk-js/browser'
import { qaHash } from '../utils.js';
import { CONTENT_TOPIC_PERSIST } from '../constants.js';
import { DispatchMetadata, Signer } from 'waku-dispatcher';
import { Identity } from '../identity.js';

export class SnapshotManager {
    private codex: Codex;
    private cache: QakuCache;
    private identity: Identity; // replace with actual wallet type
    private qas: QAList;
    private intervals: Map<string,  NodeJS.Timeout>
    private processingSnapshots: Map<string, string>

    constructor(codexOptions: CodexOptions, wallet: Identity, qas: QAList) {
        this.codex = new Codex(codexOptions.codexURL);
        this.cache = new QakuCache(codexOptions.publicCodexURL);

        this.identity = wallet;
        this.qas = qas;
        this.intervals = new Map<string,  NodeJS.Timeout>
        this.processingSnapshots = new Map<string, string>
    
    }
    prepDownload(id: string):DownloadSnapshot | undefined {
        if (!this.identity || !this.qas) return undefined;

        const qa = this.qas.get(id)
        if (!qa) throw new Error("QA does not exist")

        const snap = {
            metadata: qa.controlState,
            polls: qa.polls,
            questions: [...qa.questions.values()],
            signature: ""
        }

        const sig = this.identity.getWallet().signMessageSync(JSON.stringify(snap))

        snap.signature = sig
       
        return snap
    }



    async publishSnapshot(id: string): Promise<boolean> {
        if (!this.identity || !this.qas) return false;

        const qa = this.qas.get(id)

        if (!qa) throw new Error("QA does not exist")
        if (!qa.dispatcher) throw new Error("Dispatcher not initialized")


        const encoder = qa.dispatcher.node.createEncoder({ contentTopic: CONTENT_TOPIC_PERSIST, ephemeral: true});
        const snap = await qa.dispatcher.getLocalMessages();

        if (!snap) {
            console.error('Failed to get snapshot');
            return false;
        }

        try {
            const infoResp = await this.cache.info();
            if (infoResp.error) {
                console.error('Failed to get a public cache Codex node info');
                throw new Error(infoResp.data.toString())
            }

            const data = await (infoResp.data as Response).json();
            const res = await this.codex.node.connect(data.peerId, [data.addr]);
            if (res.error) {
                console.error(res.data);
            }
        } catch (e) {
            console.error(e);
        }

        try {
            const serialized = JSON.stringify(snap);
            const hash = sha256(serialized);

            const toPersist: PersistentSnapshot = { hash, owner: this.identity.address(), messages: snap };

            const timestamp = Date.now();

            const strategy = new BrowserUploadStrategy(JSON.stringify(toPersist), undefined, { filename: hash, mimetype: 'application/json' });
            const res = await this.codex.data.upload(strategy).result;
            console.log(res);
            if (res.error) {
                console.error('Failed to upload to Codex:', res.data);
                // updateStatus("Failed to upload snapshot to Codex", "error")
                return false;
            }

            const cid = res.data as string;
            const smsg: Snapshot = { hash, cid, timestamp };
            const result = await qa.dispatcher.emitTo(encoder, MessageType.PERSIST_SNAPSHOT, smsg, this.identity.getWallet(), true);
            console.log(result)
            if (!result) {
                console.error('Failed to publish');
            }

            const toStore: Snapshot = { cid, hash, timestamp };
            const result2 = await qa.dispatcher.emit(MessageType.SNAPSHOT, toStore, this.identity.getWallet());
            if (!result2) {
                console.error('Failed to publish snapshot');
                return false;
            }

            setStoredSnapshotInfo(id, toStore);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async importSnapshot(id: string, cid: string): Promise<boolean> {
        if (!this.identity || !this.qas) return false;

        const qa = this.qas.get(id)

        if (!qa) throw new Error("QA does not exist")
        if (!qa.dispatcher) throw new Error("Dispatcher not initialized")
        // implementation of importSnapshot function
        try {
            const res = await this.codex.data.networkDownloadStream(cid);
            if (res.error) {
                throw new Error(res.data.message)
            }

            const persisted: PersistentSnapshot = await res.data.json()
            if (!persisted || !persisted.messages || persisted.messages.length === 0) return false;
            const processingSnapshot = this.processingSnapshots.get(id)
            if (processingSnapshot && processingSnapshot == persisted.hash) {
                return false
            }

            this.processingSnapshots.set(id, persisted.hash)

            // verify the snapshot
            const [dmsg, encrypted] = await qa.dispatcher.decryptMessage(persisted.messages[0].dmsg.payload);
            if (qa.dispatcher.autoEncrypt !== encrypted) {
                console.error('expected ', encrypted ? 'encrypted' : 'plain', 'message');
                this.processingSnapshots.delete(id)
                return false;
            }


            if (dmsg.type != MessageType.CONTROL_MESSAGE) {
                console.error("expeced CONTROL_MESSAGE, got", dmsg.type)
                this.processingSnapshots.delete(id)
                return false
            }

            if (dmsg.signer != persisted.owner) {
                console.error("unexpected signer ", dmsg.signer, "!=", persisted.owner)
                this.processingSnapshots.delete(id)
                return false
            }
            const cmsg: ControlMessage = dmsg.payload
            let testId = qaHash(cmsg.title, cmsg.timestamp, cmsg.owner)

            if (cmsg.id.startsWith('X')) testId = `X${testId}`

            if (testId != cmsg.id || testId != id) {
                console.error("unexpected QA id", testId)
                this.processingSnapshots.delete(id)
                return false
            }

            // import the snapshot
            try {
                await qa.dispatcher.importLocalMessage(persisted.messages)
                console.debug("imported, dispatching local query")
            } catch (e) {
                console.error(e)
                this.processingSnapshots.delete(id)
                return false
            }

            qa.dispatcher.clearDuplicateCache()
            await qa.dispatcher.dispatchLocalQuery()
            this.processingSnapshots.delete(id)


            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async checkCodexAvailable():Promise<boolean> {
        const res = await this.codex.debug.info()
        if (res.error) {
            return false
        }
        if (res.data.table.nodes.length < 5) {
            return false
        }
        return true
    }

    async handleSnapshotMessage(id: Id, identity: Identity, payload:Snapshot, signer: Signer, _3: DispatchMetadata) {
        if (!id) throw new Error("no id")
    
        const qa = this.qas.get(id)
    
        if (!qa) throw new Error("QA does not exist")
        if (!qa.dispatcher) throw new Error("Dispatcher not initialized")
        if (signer == identity.address()) throw new Error("ignoring own snapshot")
        const snap = getStoredSnapshotInfo(id)
        if (snap !== undefined) {
            if (payload.timestamp === undefined) {
                throw new Error("old version of snapshot, ignoring")
            }
            if (snap.timestamp > payload.timestamp) {
                throw new Error("new snapshot is older than loaded one")
                
            }
            if (snap.hash == payload.hash) {
                throw new Error("already on this snapshot")
            }
    
            if (payload.timestamp+18*60*60*1000 < Date.now()) {
                throw new Error("snapshot older than 18h, ignoring")
            }
        }

        if (await this.importSnapshot(id, payload.cid)) {
            setStoredSnapshotInfo(id, payload)
        }
    }

    startPublishLoop(id: Id) {
        const qa = this.qas.get(id)
        if (!qa) throw new Error("QA not found")

        const intervalExists = this.intervals.get(id)
        if (intervalExists) return

        const snap = getStoredSnapshotInfo(id)

        //Check is stored snapshot is older than 1h and publish immediately if it is
        if (snap && snap.timestamp < Date.now() - 3600 * 1000) {
            console.log("Publishing snapshot immediately")
            this.publishSnapshot(id)
        }
        // Publish snapshot every hour
        const interval = setInterval(() => {
            this.publishSnapshot(id)
        }, 3600 * 1000)

        // Record the interval ID for cleanup in intervals
        this.intervals.set(id, interval)
    }

    //Add interval cleanup method
    public cleanupInterval(id: Id) {
        const interval = this.intervals.get(id)
        if (interval) {
            clearInterval(interval)
            this.intervals.delete(id)
        }
    }

    //Add a method to clean all intervals
    public cleanAllIntervals() {
        this.intervals.forEach((_, id) => {
            this.cleanupInterval(id)
        })
    }
}

export const LOCAL_STORAGE_SNAPSHOT_KEY = "qaku:snapshots"

const load = () => {
    let snapshotsStr = localStorage.getItem(LOCAL_STORAGE_SNAPSHOT_KEY)
    if (!snapshotsStr) {
        snapshotsStr = "{}"
    }
    const snapshots = JSON.parse(snapshotsStr)

    return snapshots
}


const getStoredSnapshotInfo = (id: string) => {
    const snapshots = load()
    const snap: Snapshot | undefined = snapshots[id]

    return snap
}

const setStoredSnapshotInfo = (id: string, snap: Snapshot) => {
    const snapshots = load()
    console.log(snap)

    snapshots[id] = snap
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(snapshots))
}

