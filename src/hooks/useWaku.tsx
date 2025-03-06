import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    createLightNode,
    waitForRemotePeer,
    createDecoder,
    LightNode,
    EConnectionStateEvents,
  } from "@waku/sdk";
import {
    IWaku
} from "@waku/interfaces"
import { DEFAULT_BOOTSTRAP, PROTOCOLS, STATIC_NODES } from "../constants";

export type WakuInfo = {
    node: IWaku | undefined;
    status: string;
    connected: boolean;
    start: () => void;
    stop: () => void;
    filterPeers: string[];
    storePeers: string[];
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
   //"/dns4/waku.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAm5i46EuYtCeW7zAKuQskR2BZcy2s7m8jB48DPcaexwEKq",
]


export const WakuContextProvider = ({ children, updateStatus }: Props) => {
    const [status, setStatus] = useState<string>("disconnected")
    const [connected, setConnected] = useState<boolean>(false)
    const [filterPeers, setFilterPeers] = useState<string[]>([])
    const [storePeers, setStorePeers] = useState<string[]>([])
    const [connecting, setConnecting] = useState<boolean>(false)
    const [node, setNode] = useState<LightNode>()

    const [printPeers, setPrintPeers] = useState<number>(0)

    const start = useCallback(async () => {
        let interval: NodeJS.Timeout | undefined = undefined

        if (connected || connecting || node) return
        setConnecting(true)
        setStatus("starting")
        updateStatus("Starting Waku node", "info", 2000)
        await createLightNode({
            networkConfig: {clusterId: 1, shards: [0]},
            defaultBootstrap: true,
            //bootstrapPeers: bootstrapNodes,
            numPeersToUse: 3,
            
        }).then( async (ln: LightNode) => {
            if (node) return
            setNode(ln)
            setStatus("connecting")

            ln.connectionManager.addEventListener(EConnectionStateEvents.CONNECTION_STATUS, (e) => {
                //console.log(e)
            })

            
            try {
                await waitForRemotePeer(ln, PROTOCOLS)
                updateStatus("Waku node successfully connected", "success", 5000)
                console.log(await ln.libp2p.peerStore.all())
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
            filterPeers,
            storePeers

        }),
        [
            node,
            status,
            connected,
            start,
            stop,
            filterPeers,
            storePeers,
        ]
    )

    return ( <WakuContext.Provider value={{ providerInfo: wakuInfo }}>
        { children }
    </WakuContext.Provider>)
}