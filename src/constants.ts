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