import { useEffect, useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import { DownloadSnapshot } from "../utils/messages"

interface IProps {
    id: string
} 

const Control = ({id}: IProps) => {
    const {controlState, qaku, isOwner, localQuestions, polls} = useQakuContext()
    const [enabled, setEnabled] = useState(false)

    const saveTemplateAsFile = (filename:string, dataObjToWrite:DownloadSnapshot | undefined) => {
        if (!dataObjToWrite) return
        const blob = new Blob([JSON.stringify(dataObjToWrite, null, 2)], { type: "text/json" });
        const link = document.createElement("a");
    
        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");
    
        const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
    
        link.dispatchEvent(evt);
        link.remove()
    };
    
    useEffect(() => {
        if (!controlState) return
        setEnabled(controlState.enabled)
        
    }, [controlState])
    return (
        <>
            { controlState && isOwner &&
                <>
                <div className="m-auto max-w-md text-center bg-neutral p-2 w-fill rounded-xl">
                    <div>
                        <h1 className="font-bold">{controlState.title}</h1>
                        <div className="flex m-auto items-center justify-center">
                            <div className="flex-col m-2"><button onClick={() => qaku?.switchQAState(id, !enabled)} disabled={!id || !controlState} className={`btn`}>{ enabled ? "disable" : "enable"}</button></div>
                            <div className="flex-col m-2">
                                { (localQuestions.length > 0 || polls.length > 0) && <button className="btn" onClick={()=> qaku?.snapshotManager?.publishSnapshot(id)}>Publish Snapshot</button>}
                            </div>   
                        </div>

                    </div>
                </div>
                </>
            }
        </>
    )
}

export default Control;

/*
<div className="flex-col m-2">
                                { (localQuestions.length > 0 || polls.length > 0) && <button className="btn" onClick={()=> saveTemplateAsFile("data.json", snapshot())}>Download</button>}
                            </div>
                            <div className="flex-col m-2">
                                { (localQuestions.length > 0 || polls.length > 0) && <button className="btn" onClick={()=> publishSnapshot()}>Publish Snapshot</button>}
                            </div>*/