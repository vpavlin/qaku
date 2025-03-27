import { useEffect, useState } from "react";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL, DEFAULT_WAKU_CLUSTER_ID, DEFAULT_WAKU_SHARD_ID, WAKU_CLUSTER_ID_STORAGE_KEY, WAKU_SHARD_ID } from "../constants";
import User from "./user";

const Settings = () => {
    const storedCodexURL = localStorage.getItem(CODEX_URL_STORAGE_KEY)
    const storedPublicCodexURL = localStorage.getItem(CODEX_PUBLIC_URL_STORAGE_KEY)
    const storedWakuClusterId = localStorage.getItem(WAKU_CLUSTER_ID_STORAGE_KEY)
    const storedWakuShardId = localStorage.getItem(WAKU_SHARD_ID)


    const [codexURL, setCodexURL] = useState(storedCodexURL || DEFAULT_CODEX_URL)
    const [publicCodexURL, setPublicCodexURL] = useState(storedPublicCodexURL || DEFAULT_PUBLIC_CODEX_URL)
    const [wakuClusterId, setClusterId] = useState(storedWakuClusterId || DEFAULT_WAKU_CLUSTER_ID)
    const [wakuShardId, setShardId] = useState(storedWakuShardId || DEFAULT_WAKU_SHARD_ID)



    useEffect(() => {
        localStorage.setItem(CODEX_URL_STORAGE_KEY, codexURL)
    }, [codexURL])

    useEffect(() => {
        localStorage.setItem(CODEX_PUBLIC_URL_STORAGE_KEY, publicCodexURL)
    }, [publicCodexURL])

    useEffect(() => {
        localStorage.setItem(WAKU_CLUSTER_ID_STORAGE_KEY, wakuClusterId)
    }, [wakuClusterId])

    useEffect(() => {
        localStorage.setItem(WAKU_SHARD_ID, wakuShardId)
    }, [wakuShardId])


    return (
        <div className="h-full w-full flex justify-center items-center flex-col">

        <div className="flex-row bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center ">
            <label className="label flex-wrap w-full">
                <span className="label-text">Codex Node URL (used to publish your Q&A snapshots)</span>
                <input className="textarea textarea-bordered textarea-lg w-full" value={codexURL} onChange={(e) => setCodexURL(e.target.value)} />
            </label>
        </div>
        <div className="flex-row bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center ">
            <label className="label flex-wrap w-full">
                <span className="label-text">URL of Public Qaku Cache Node (used to pull your Q&A snapshots if local node is not available)</span>
                <input className="textarea textarea-bordered textarea-lg w-full" value={publicCodexURL} onChange={(e) => setPublicCodexURL(e.target.value)} />
            </label>
        </div>
        <div className="flex-row bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center ">
            <label className="label flex-wrap w-full">
                <span className="label-text">Waku Cluster ID (The Waku Network is <strong>1</strong>)</span>
                <input className="textarea textarea-bordered textarea-lg w-full" value={wakuClusterId} onChange={(e) => setClusterId(e.target.value)} />
            </label>
        </div>
        <div className="flex-row bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center ">
            <label className="label flex-wrap w-full">
                <span className="label-text">Waku Shard ID</span>
                <input className="textarea textarea-bordered textarea-lg w-full" value={wakuShardId} onChange={(e) => setShardId(e.target.value)} />
            </label>
        </div>
        <div className="flex-row bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center">
            <User />
        </div>
        </div>
    )
}

export default Settings;