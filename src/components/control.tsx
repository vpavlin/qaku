import { useEffect, useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import { EnhancedQuestionMessage } from "../utils/messages"

interface IProps {
    id: string
}

const saveTemplateAsFile = (filename:string, dataObjToWrite:EnhancedQuestionMessage[]) => {
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

const Control = ({id}: IProps) => {
    const {controlState, switchState, isOwner, localQuestions} = useQakuContext()
    const [enabled, setEnabled] = useState(false)
    
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
                            <div className="flex-col m-2"><button onClick={() => switchState(!enabled)} disabled={!id || !controlState} className={`btn`}>{ enabled ? "disable" : "enable"}</button></div>
                            <div className="flex-col m-2">
                                { localQuestions.length > 0 && <button className="btn" onClick={()=> saveTemplateAsFile("data.json", localQuestions)}>Download</button>}
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