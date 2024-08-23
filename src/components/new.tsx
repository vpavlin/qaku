import { useState } from "react";
import { sha256 } from "js-sha256";
import { useNavigate } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { ControlMessage, MessageType, QakuMessage } from "../utils/messages";
import { CONTENT_TOPIC_MAIN, DISPATCHER_DB_NAME } from "../constants";
import getDispatcher, { destroyDispatcher } from "waku-dispatcher";
import { useWakuContext } from "../hooks/useWaku";
import { useToastContext } from "../hooks/useToast";

const NewQA = () => {
    const { error } = useToastContext()
    const { node, connected } = useWakuContext()
    const { wallet, historyAdd } = useQakuContext()
    const navigate = useNavigate();

    const [dispatcher, setDispatcher] = useState()

    const [title, setTitle] = useState<string>()
    const [desc, setDesc] = useState<string>()
    const [enabled, setEnabled] = useState<boolean>(true)
    const [moderation, SetModeration] = useState<boolean>(false)

    const submit = async () => {
        if (!node || !title || !wallet) return

        const ts = new Date();
        const hash = sha256(title + ts.toString()).slice(0, 8)

        const cmsg:ControlMessage = {
            title: title,
            description: desc || "",
            id: hash,
            enabled: enabled,
            timestamp: new Date(),
            owner: wallet.address,
            admins: [],
            moderation: moderation
        }

        await destroyDispatcher()
        const dispatcher = await getDispatcher(node, CONTENT_TOPIC_MAIN(hash), "qaku-"+hash, false)
        if (!dispatcher) return
        dispatcher.on(MessageType.CONTROL_MESSAGE, () => {})
        const result = await dispatcher.emit(MessageType.CONTROL_MESSAGE, cmsg, wallet)
        if (result) {
            historyAdd(hash, title)
            navigate("/q/"+hash)
        } else {
            error("Failed to create the Q&A")
        }
        
        await destroyDispatcher()
        console.debug("Destroyed dispatcher...")
    }

    return (
        <>
        { !connected ? 
            <div className="h-full w-full flex justify-center items-center">
                                <div className="loading loading-lg"></div>
                            </div>
                            :
        <div className="h-full w-full flex justify-center items-center">
        <div className="bg-base-300 my-3 w-full max-w-3xl p-10 form-control m-auto justify-center space-y-3">
            <div className="text-xl">Create new Q&A</div>
            <label className="label flex-wrap">
                <span className="label-text">Title</span>
                <input type="text" name="title" onChange={(e) => setTitle(e.target.value)} className="input input-bordered w-full max-w-sm"/>
            </label>
            <label className="label flex-wrap">
                <span className="label-text">Description</span>
                <textarea className="textarea textarea-bordered textarea-lg w-full" onChange={(e) => setDesc(e.target.value)}></textarea>
            </label>
            <label className="label">
                <input type="checkbox" checked={enabled} className="checkbox" onChange={(e) => setEnabled(e.target.checked)} />
                <span className="label-text">Enabled</span>
            </label>
            <label className="label">
                <input type="checkbox" checked={moderation} className="checkbox" onChange={(e) => SetModeration(e.target.checked)} />
                <span className="label-text">Enable Owner Moderation</span>
            </label>
            
            <button onClick={() => submit()}  className="btn btn-lg">Submit</button>
        </div>
        </div>
        }
        </>
    )
}

export default NewQA;