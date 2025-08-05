export const CONTENT_TOPIC_MAIN = (hash: string) => `/0/qaku/1/main-${hash}/json`
export const CONTENT_TOPIC_PERSIST = "/0/qaku/1/persist/json"

export const DEFAULT_CODEX_URL = "http://localhost:8080"
export const DEFAULT_PUBLIC_CODEX_URL = "https://api.qaku.app"//"http://localhost:8081"//

// Simple in-memory ENS cache with 1-hour expiration
export const ENS_CACHE = new Map<string, { name: string | null, timestamp: number }>();
export const ENS_CACHE_TTL = 60 * 60 * 24 * 1000;  // 1 day in milliseconds

export const MAINNET_RPC_URLS = [
    "https://ethereum.publicnode.com",
    "https://rpc.ankr.com/eth",
    "https://eth.llamarpc.com"
  ];

//CID cache - allowing to set and get mapping between human readble namCIDs