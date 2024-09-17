import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    createLightNode,
    waitForRemotePeer,
    createDecoder,
    LightNode,
  } from "@waku/sdk";
import { DEFAULT_BOOTSTRAP, PROTOCOLS, STATIC_NODES } from "../constants";
import { multiaddr } from "@multiformats/multiaddr";

export type WakuInfo = {
    node: LightNode | undefined;
    status: string;
    connected: boolean;
    start: () => void;
    stop: () => void;
    filterPeers: number;
    lightpushPeers: number;
    storePeers: number;
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

/*
const bootstrapNodes = [
    "/dns4/node-01.do-ams3.status.prod.statusim.net/tcp/443/wss/p2p/16Uiu2HAm6HZZr7aToTvEBPpiys4UxajCTU97zj5v7RNR2gbniy1D",
    "/dns4/node-02.do-ams3.status.prod.statusim.net/tcp/443/wss/p2p/16Uiu2HAmSve7tR5YZugpskMv2dmJAsMUKmfWYEKRXNUxRaTCnsXV",
    "/dns4/node-01.ac-cn-hongkong-c.waku.test.statusim.net/tcp/8000/wss/p2p/16Uiu2HAkzHaTP5JsUwfR9NR8Rj9HC24puS6ocaU8wze4QrXr9iXp",
]*/

const bootstrapNodes: string[] = [
   //"/dns4/waku.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmMJy3oXGzRjt2iKmYoCnaEkj55rE55YperMpemtGs9Da2",
]


export const WakuContextProvider = ({ children }: Props) => {
    const [status, setStatus] = useState<string>("disconnected")
    const [connected, setConnected] = useState<boolean>(false)
    const [filterPeers, setFilterPeers] = useState<number>(0)
    const [lightpushPeers, setLightpushPeers] = useState<number>(0)
    const [storePeers, setStorePeers] = useState<number>(0)
    const [connecting, setConnecting] = useState<boolean>(false)
    const [node, setNode] = useState<LightNode>()

    const start = useCallback(async () => {
        let interval: NodeJS.Timeout | undefined = undefined
        if (connected || connecting || node) return
        setConnecting(true)
        setStatus("starting")
        await createLightNode({
            defaultBootstrap: true,
            pingKeepAlive: 60,
            //bootstrapPeers: bootstrapNodes,
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
                    
                interval = setInterval(() => {
                    setLightpushPeers(ln.lightPush.connectedPeers.length)
                    setFilterPeers(ln.filter.connectedPeers.length)
                    setStorePeers(ln.store.connectedPeers.length)
                }, 1000)
            } finally {
                setConnecting(false)
            }
        })

        return () => {
            clearInterval(interval)
        }
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
            lightpushPeers,
            storePeers

        }),
        [
            node,
            status,
            connected,
            start,
            stop,
            filterPeers,
            lightpushPeers,
            storePeers,
        ]
    )

    return ( <WakuContext.Provider value={{ providerInfo: wakuInfo }}>
        { children }
    </WakuContext.Provider>)
}