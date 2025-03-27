import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    createLightNode,
    waitForRemotePeer,
    createDecoder,
    LightNode,
    EConnectionStateEvents,
  } from "@waku/sdk";
import {
    HealthStatus,
    HealthStatusChangeEvents,
    IWaku
} from "@waku/interfaces"
import { DEFAULT_BOOTSTRAP, DEFAULT_WAKU_CLUSTER_ID, DEFAULT_WAKU_SHARD_ID, PROTOCOLS, STATIC_NODES, WAKU_CLUSTER_ID_STORAGE_KEY, WAKU_SHARD_ID } from "../constants";

export type WakuInfo = {
    node: IWaku | undefined;
    status: string;
    connected: boolean;
    health: HealthStatus
    start: () => void;
    stop: () => void;
}

export type WakuContextData = {
    providerInfo: WakuInfo;
} | null;

export const WakuContext = React.createContext<WakuContextData>(null);

export const useWakuContext = () => {
    const wakuContext = useContext(WakuContext);

    if (!wakuContext) {
        throw new Error("WakuContext at a wrong level")
    }
    const { providerInfo } = wakuContext;
    return useMemo<WakuInfo>(() => {
        return {...providerInfo}
    }, [wakuContext])
}

export const useWakuDecoder = (contentTopic: string) => {
    return useMemo(() => {
        return createDecoder(contentTopic)
    }, [contentTopic])
}

interface Props {
    updateStatus: (msg: string, typ: string, delay?: number) => void
    children: React.ReactNode
}

/*
const bootstrapNodes = [
    "/dns4/node-01.do-ams3.status.prod.statusim.net/tcp/443/wss/p2p/16Uiu2HAm6HZZr7aToTvEBPpiys4UxajCTU97zj5v7RNR2gbniy1D",
    "/dns4/node-02.do-ams3.status.prod.statusim.net/tcp/443/wss/p2p/16Uiu2HAmSve7tR5YZugpskMv2dmJAsMUKmfWYEKRXNUxRaTCnsXV",
    "/dns4/node-01.ac-cn-hongkong-c.waku.test.statusim.net/tcp/8000/wss/p2p/16Uiu2HAkzHaTP5JsUwfR9NR8Rj9HC24puS6ocaU8wze4QrXr9iXp",
]*/

const bootstrapNodes: string[] = [
   "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
   "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/30303/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
]


export const WakuContextProvider = ({ children, updateStatus }: Props) => {
    const [status, setStatus] = useState<string>("disconnected")
    const [connected, setConnected] = useState<boolean>(false)
    const [connecting, setConnecting] = useState<boolean>(false)
    const [node, setNode] = useState<LightNode>()
    const [health, setHealth] = useState<HealthStatus>(HealthStatus.Unhealthy)

    const start = useCallback(async () => {
        if (connected || connecting || node) return

        setConnecting(true)        
        setStatus("starting")
        updateStatus("Starting Waku node", "info", 2000)

        const wakuClusterId = localStorage.getItem(WAKU_CLUSTER_ID_STORAGE_KEY) || DEFAULT_WAKU_CLUSTER_ID
        const wakuShardId = localStorage.getItem(WAKU_SHARD_ID) || DEFAULT_WAKU_SHARD_ID
        await createLightNode({
            networkConfig: {clusterId: parseInt(wakuClusterId), shards: [parseInt(wakuShardId)]},
            defaultBootstrap: false,
            bootstrapPeers: bootstrapNodes,
            numPeersToUse: 3,
            
        }).then( async (ln: LightNode) => {
            if (node) return
            setNode(ln)
            setStatus("connecting")

            ln.connectionManager.addEventListener(EConnectionStateEvents.CONNECTION_STATUS, (e) => {
                //console.log(e)
            })

            
            try {
                await ln.waitForPeers(PROTOCOLS, 30000)
                updateStatus("Waku node successfully connected", "success", 5000)
                console.log(await ln.libp2p.peerStore.all())
                ln.health.addEventListener(HealthStatusChangeEvents.StatusChange, (hs) => {
                        setHealth(hs.detail)
                    })
                setStatus("connected")
                setConnected(true)
                setConnecting(false)
            } finally {
                setConnecting(false)
            }
        })


     }, [])

    const stop = () => {
        node?.stop()
        setConnected(false)
        setStatus("stopped")
    }
    


    const wakuInfo = useMemo(
        () => ({
            node,
            status,
            connected,
            start,
            stop,
            health,
        }),
        [
            node,
            status,
            connected,
            start,
            stop,
            health,
        ]
    )

    return ( <WakuContext.Provider value={{ providerInfo: wakuInfo }}>
        { children }
    </WakuContext.Provider>)
}