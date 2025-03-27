import { Protocols } from "@waku/sdk"

export const STATIC_NODES = [
 //"/dns4/waku-pg.myrandomdemos.online/tcp/8000/wss/p2p/16Uiu2HAmR8bssmvd6Q6A3U5gjSjPeJsU5Dxop4ZsTMBzYA3U8v1V",
 //"/dns4/waku.myrandomdemos.online/tcp/8000/wss/p2p/16Uiu2HAmDdZ1brt7nq717ugWSK1EcGdaxUMVmHeVFzcPGb9q9fq5",
 //"/dns4/waku2.myrandomdemos.online/tcp/8000/wss/p2p/16Uiu2HAmHKj9KTUEUPpw9F3EaDkT6QVXZNTRVerFJJtnkcC5CHgx",
] 
export const DEFAULT_BOOTSTRAP = true;
export const PROTOCOLS = [Protocols.LightPush, Protocols.Filter, Protocols.Store]
//export const CONTENT_TOPIC_QUESTIONS = (hash: string) => `/0/qaku/1/questions-${hash}/json`
export const CONTENT_TOPIC_MAIN = (hash: string) => `/0/qaku/1/main-${hash}/json`
export const CONTENT_TOPIC_ACTIVITY = (hash: string) => `/0/qaku/1/activity-${hash}/json`
export const CONTENT_TOPIC_PERSIST = "/0/qaku/1/persist/json"

export const DISPATCHER_DB_NAME = "qaku"

export const DEFAULT_CODEX_URL = "http://localhost:8080"
export const CODEX_URL_STORAGE_KEY = "qaku:codex-api-url"
export const DEFAULT_PUBLIC_CODEX_URL = "https://api.qaku.app"//"http://localhost:8081"//
export const CODEX_PUBLIC_URL_STORAGE_KEY = "qaku:codex-public-url"

export const DEFAULT_WAKU_CLUSTER_ID = "42"
export const DEFAULT_WAKU_SHARD_ID = "0"
export const WAKU_CLUSTER_ID_STORAGE_KEY = "qaku:waku-cluster-id"
export const WAKU_SHARD_ID = "qaku_waku-shard-id"


export const DEFAULT_PUBLISH_INTERVAL = 2*60*60*1000