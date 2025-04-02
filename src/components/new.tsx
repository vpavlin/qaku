import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";

import { useWakuContext } from "../hooks/useWaku";
import { useToastContext } from "../hooks/useToast";


const NewQA = () => {
    const { error } = useToastContext()
    const { node, connected } = useWakuContext()
    const { qaku } = useQakuContext()
    const navigate = useNavigate();

    const [title, setTitle] = useState<string>()
    const [desc, setDesc] = useState<string>()
    const [enabled, setEnabled] = useState<boolean>(true)
    const [moderation, SetModeration] = useState<boolean>(false)
    const [password, setPassword] = useState<string>()
    const [admins, setAdmins] = useState<string[]>([])


    const submit = async () => {
        console.log("Submitting...", qaku)
        if (!qaku || !node || !title) return

        console.log("Doing something")
        const id = await qaku.newQA(title, desc, enabled, admins, moderation, password)
        await qaku.initQA(id, password)

        if (id) {
            
            if (password) {
                navigate("/q/"+id+"/"+password, {flushSync: true})
            } else {
                navigate("/q/"+id)
            }
        } else {
            error("Failed to create the Q&A")
        }
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
                <span className="label-text">Q&A Enabled immediately after creation</span>
            </label>
            <label className="label">
                <input type="checkbox" checked={moderation} className="checkbox" onChange={(e) => SetModeration(e.target.checked)} />
                <span className="label-text">Enable Owner Moderation</span>
            </label>
            <label className="label flex-wrap">
                <span className="label-text">Password (for encrypted Q&As)</span>
                <input type="text" name="title" value={password} onChange={(e) => setPassword(e.target.value)} className="input input-bordered w-3/6 max-w-sm"/>
                <button className="btn btn-sm" onClick={() => setPassword(Math.random().toString(36).slice(2, 8))}>Generate</button>
            </label>
            <label className="label flex-wrap">
                <span className="label-text">Admins (list of addresses separated by a newline)</span>
                <textarea className="textarea textarea-bordered textarea-lg w-full" onChange={(e) => setAdmins(e.target.value.split("\n"))}></textarea>
            </label>
            <div>
                {qaku?.identity?.address()}
            </div>

            
            <button onClick={() => submit()}  disabled={!qaku} className="btn btn-lg">Submit {qaku == undefined ? "failed" : "ready"}</button>
        </div>
        </div>
        }
        </>
    )
}

export default NewQA;