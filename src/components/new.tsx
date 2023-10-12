import { useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { sha256 } from "js-sha256";
import { useNavigate } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { ControlMessage, MessageType, QakuMessage } from "../utils/messages";
import { CONTENT_TOPIC_MAIN } from "../constants";

const NewQA = () => {
    const {connected, subscribe, publish} = useWakuContext()
    const { wallet, historyAdd } = useQakuContext()
    const navigate = useNavigate();

    const [title, setTitle] = useState<string>()
    const [desc, setDesc] = useState<string>()
    const [enabled, setEnabled] = useState<boolean>(true)
    const [moderation, SetModeration] = useState<boolean>(false)

    const submit = async () => {
        if (!connected || !title || !wallet) return

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
        const msg:QakuMessage = {signer: wallet.address, signature: undefined, payload: JSON.stringify(cmsg), type: MessageType.CONTROL_MESSAGE}
        const sig = wallet.signMessageSync(JSON.stringify(cmsg))
        if (!sig) return
        
        msg.signature = sig

        const result = await publish(CONTENT_TOPIC_MAIN(hash), JSON.stringify(msg))

        if (result && !result.error) {
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