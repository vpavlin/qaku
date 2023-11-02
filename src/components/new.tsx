import { useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { sha256 } from "js-sha256";
import { useNavigate } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { ControlMessage, MessageType, QakuMessage } from "../utils/messages";
import { CONTENT_TOPIC_MAIN, DISPATCHER_DB_NAME } from "../constants";
import getDispatcher, { destroyDispatcher } from "waku-dispatcher";

const NewQA = () => {
    const { wallet, historyAdd } = useQakuContext()
    const {connected, node} = useWakuContext()
    const navigate = useNavigate();

    const [title, setTitle] = useState<string>()
    const [desc, setDesc] = useState<string>()
    const [enabled, setEnabled] = useState<boolean>(true)
    const [moderation, SetModeration] = useState<boolean>(false)

    const submit = async () => {
        if (!connected || !title || !wallet || !node) return

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

        const dispatcher = await getDispatcher(node, CONTENT_TOPIC_MAIN(hash), DISPATCHER_DB_NAME, false)
        console.log(dispatcher)
        if (!dispatcher) return
        console.log(cmsg)
        const result = await dispatcher.emit(MessageType.CONTROL_MESSAGE, cmsg, wallet) //FIXME: We don't have a content topic at this point - what do we do?
        console.log(result)
        destroyDispatcher()

        if (result && result.errors?.length == 0) {
            historyAdd(hash, title)
            navigate("/q/"+hash)
        }
    }

    return (
        <>
        <div className="border rounded-md p-10 form-control max-w-md m-auto">
    
            <label className="label">
                <span className="label-text">Title</span>
                <input type="text" name="title" onChange={(e) => setTitle(e.target.value)} className="input input-bordered w-full max-w-xs m-5"/>
            </label>
            <label className="label">
            <span className="label-text">Description</span>
            </label>
                <textarea className="textarea textarea-bordered textarea-lg w-full" onChange={(e) => setDesc(e.target.value)}></textarea>
            <label className="label">
                <input type="checkbox" checked={enabled} className="checkbox" onChange={(e) => setEnabled(e.target.checked)} />
                <span className="label-text">Enabled</span>
            </label>
            <label className="label">
                <input type="checkbox" checked={moderation} className="checkbox" onChange={(e) => SetModeration(e.target.checked)} />
                <span className="label-text">Enable Owner Moderation</span>
            </label>
            
            <button onClick={() => submit()} disabled={!connected} className="btn">Submit</button>
        </div>
        </>
    )
}

export default NewQA;