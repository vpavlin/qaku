import { useEffect, useState } from "react";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL } from "../constants";
import User from "./user";

const Settings = () => {
    const storedCodexURL = localStorage.getItem(CODEX_URL_STORAGE_KEY)
    const storedPublicCodexURL = localStorage.getItem(CODEX_PUBLIC_URL_STORAGE_KEY)

    const [codexURL, setCodexURL] = useState(storedCodexURL || DEFAULT_CODEX_URL)
    const [publicCodexURL, setPublicCodexURL] = useState(storedPublicCodexURL || DEFAULT_PUBLIC_CODEX_URL)


    useEffect(() => {
        localStorage.setItem(CODEX_URL_STORAGE_KEY, codexURL)
    }, [codexURL])

    useEffect(() => {
        localStorage.setItem(CODEX_PUBLIC_URL_STORAGE_KEY, publicCodexURL)
    }, [publicCodexURL])


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
        <div className="flex-row bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center">
            <User />
        </div>
        </div>
    )
}

export default Settings;