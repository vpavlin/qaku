import React, { useCallback, useContext, useMemo, useState } from "react";
import {
    createLightNode,
    waitForRemotePeer,
    createDecoder,
    bytesToUtf8,
    LightNode,
    Protocols,
    IDecoder,
    Callback,
    DecodedMessage,
    Unsubscribe,
    createEncoder,
    IMessage,
    utf8ToBytes,
    waku,
    SendResult,
    PageDirection,
    StoreQueryOptions,
  } from "@waku/sdk";
import { DEFAULT_BOOTSTRAP, PROTOCOLS, STATIC_NODES } from "../constants";
import { multiaddr } from "@multiformats/multiaddr";

export type WakuInfo = {
    node: LightNode | undefined;
    status: string;
    connected: boolean;
    start: () => void;
    stop: () => void;
    publish: (contentTopic: string, message: string) => Promise<SendResult | void>;
    subscribe: (contentTopic: string, callback: Callback<DecodedMessage>) => Unsubscribe | Promise<Unsubscribe> | void;
    query: <T>(contentTopic: string, decode: (msg: any) => any, options?: StoreQueryOptions) => Promise<T[]>
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


export const WakuContextProvider = ({ children }: Props) => {
    const [status, setStatus] = useState<string>("disconnected")
    const [connected, setConnected] = useState<boolean>(false)
    const [connecting, setConnecting] = useState<boolean>(false)
    const [node, setNode] = useState<LightNode>()

    const start = useCallback(async () => {

        if (connected || connecting || node) return
        setConnecting(true)
        setStatus("starting")
        createLightNode({ defaultBootstrap: DEFAULT_BOOTSTRAP }).then( async (ln: LightNode) => {
            if (node) return
            setNode(ln)
            setStatus("connecting")
            for (var n of STATIC_NODES) {
                const ma = multiaddr(n);
                await ln.dial(ma, PROTOCOLS)
            }
            
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

    const publish = async (contentTopic: string, message: string): Promise<void | SendResult> => {
        if (!node || !connected) return
        const encoder = createEncoder({contentTopic})
        const wakuMessage:IMessage = {payload: utf8ToBytes(message), timestamp: new Date()}
        return await node.lightPush.send(encoder, wakuMessage)
    }

    const subscribe = (contentTopic: string, callback: Callback<DecodedMessage>): Unsubscribe | Promise<Unsubscribe> | void => {
        if (!node || !connected) return
        const decoder = createDecoder(contentTopic)

        console.log(contentTopic)
     

        return node.filter.subscribe(decoder, callback)
    }

    const query = async <T,>(contentTopic: string, decode: (msg: any) => any, options?: StoreQueryOptions): Promise<T[]> => {
        const decoder = createDecoder(contentTopic)
        let result:T[] = []
        if (!node || !connected ) return result

        console.log("querying")

        if (!options) {
            options = {
                pageDirection: PageDirection.FORWARD,
              }
        }

        try {
            for await (const messagesPromises of node.store.queryGenerator(
              [decoder],
              options
            )) {
                const messages = await Promise.all(
                    messagesPromises
                        .map(async (p) => {
                            const msg = await p;
                            return decode(msg);
                        })
                        .filter(Boolean)
                    );

                if (messages) {
                    result = result.concat(messages)
                }

                return result
            }
        } catch (e) {
            console.log("Failed to retrieve messages", e);
        }

        return result
    }

    const wakuInfo = useMemo(
        () => ({
            node,
            status,
            connected,
            start,
            stop,
            publish,
            subscribe,
            query,
        }),
        [
            node,
            status,
            connected,
            start,
            stop,
            publish,
            subscribe,
            query,
        ]
    )

    return ( <WakuContext.Provider value={{ providerInfo: wakuInfo }}>
        { children }
    </WakuContext.Provider>)
}