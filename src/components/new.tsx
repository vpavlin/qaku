import { useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { DecodedMessage, bytesToUtf8 } from "@waku/sdk";
import { SendResult } from "@waku/sdk";
import { sha256 } from "js-sha256";
import { unsubscribe } from "diagnostics_channel";
import { useNavigate } from "react-router-dom";
import { CONTENT_TOPIC_CONTROL } from "../constants";
import { useQakuContext } from "../hooks/useQaku";
import { signMessage } from "../utils/crypto";
import { ControlMessage } from "../utils/messages";



const NewQA = () => {
    const {connected, subscribe, publish} = useWakuContext()
    const { key, pubKey } = useQakuContext()
    const navigate = useNavigate();


    const [title, setTitle] = useState<string>()
    const [enabled, setEnabled] = useState<boolean>(true)


    const submit = async () => {
        if (!connected || !title || !key || !pubKey) return

        const hash = sha256(title)  

        const msg:ControlMessage = {title: title, id: hash, enabled: true, timestamp: new Date(), signer: pubKey, signature: undefined}
        const sig = signMessage(key, JSON.stringify(msg))
        if (!sig) return

        console.log(sig)
        
        msg.signature = sig

        const result = await publish(CONTENT_TOPIC_CONTROL(hash), JSON.stringify(msg))

        if (result && !result.error) navigate("/q/"+hash)
    }

    return (
        <>
        <div className="border rounded-sm p-10 form-control max-w-md m-auto">
    
            <label className="label">
            <span className="label-text">Title</span>
            <input type="text" name="title" onChange={(e) => setTitle(e.target.value)} className="input input-bordered w-full max-w-xs m-5"/>
            </label>
            <label className="label">
                <input type="checkbox" checked={enabled} className="checkbox" onChange={(e) => setEnabled(e.target.checked)} />
                <span className="label-text">Enabled</span>
            </label>
            
            <button onClick={() => submit()} disabled={!connected} className="btn">Submit</button>
        </div>
        </>
    )
}

export default NewQA;