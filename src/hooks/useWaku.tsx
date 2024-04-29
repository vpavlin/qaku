import React, { useCallback, useContext, useMemo, useState } from "react";
import {
    createLightNode,
    waitForRemotePeer,
    createDecoder,
    LightNode,
  } from "@waku/sdk";
  import { DefaultPubsubTopic } from "@waku/interfaces";
import { DEFAULT_BOOTSTRAP, PROTOCOLS, STATIC_NODES } from "../constants";
import { multiaddr } from "@multiformats/multiaddr";

export type WakuInfo = {
    node: LightNode | undefined;
    status: string;
    connected: boolean;
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
    children: React.ReactNode
}

const bootstrapNodes = [
    "/dns4/node-01.do-ams3.status.prod.statusim.net/tcp/443/wss/p2p/16Uiu2HAm6HZZr7aToTvEBPpiys4UxajCTU97zj5v7RNR2gbniy1D",
    "/dns4/node-02.do-ams3.status.prod.statusim.net/tcp/443/wss/p2p/16Uiu2HAmSve7tR5YZugpskMv2dmJAsMUKmfWYEKRXNUxRaTCnsXV",
    "/dns4/node-01.ac-cn-hongkong-c.waku.test.statusim.net/tcp/8000/wss/p2p/16Uiu2HAkzHaTP5JsUwfR9NR8Rj9HC24puS6ocaU8wze4QrXr9iXp",
]


export const WakuContextProvider = ({ children }: Props) => {
    const [status, setStatus] = useState<string>("disconnected")
    const [connected, setConnected] = useState<boolean>(false)
    const [connecting, setConnecting] = useState<boolean>(false)
    const [node, setNode] = useState<LightNode>()

    const start = useCallback(async () => {

        if (connected || connecting || node) return
        setConnecting(true)
        setStatus("starting")
        await createLightNode({
            pubsubTopics: [DefaultPubsubTopic],
            defaultBootstrap: false,
            pingKeepAlive: 60,
            bootstrapPeers: bootstrapNodes,
            numPeersToUse: 3,
        }).then( async (ln: LightNode) => {
            if (node) return
            setNode(ln)
            setStatus("connecting")
            
            try {
                await waitForRemotePeer(ln, PROTOCOLS)
                //console.log(await ln.libp2p.peerStore.all())
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

        }),
        [
            node,
            status,
            connected,
            start,
            stop,
        ]
    )

    return ( <WakuContext.Provider value={{ providerInfo: wakuInfo }}>
        { children }
    </WakuContext.Provider>)
}