//import { StoreMsg } from "waku-dispatcher"


export interface DownloadSnapshot {
  metadata: any;
  polls: any;
  questions: any[];
  signature: string;
}

export interface PersistentSnapshot {
  hash: string;
  owner: string;
  messages: any[]; //FIXME
}

export interface Snapshot {
  hash: string;
  cid: string;
  timestamp: number;
}

export interface CodexOptions {
  codexURL: string;
  publicCodexURL: string;
}
