import { useEffect, useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import { DownloadSnapshot } from "../utils/messages"
import { Settings, Power, Camera } from "lucide-react"

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

    if (!controlState || !isOwner) return null

    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Control Panel</h3>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Power className="w-4 h-4" />
                        <span className="text-sm font-medium">Q&A Status</span>
                    </div>
                    <button 
                        onClick={() => qaku?.switchQAState(id, !enabled)} 
                        disabled={!id || !controlState}
                        className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                            enabled 
                                ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
                                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        }`}
                    >
                        {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                {(localQuestions.length > 0 || polls.length > 0) && (
                    <button 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
                        onClick={() => qaku?.snapshotManager?.publishSnapshot(id)}
                    >
                        <Camera className="w-4 h-4" />
                        Publish Snapshot
                    </button>
                )}
            </div>
        </div>
    )
}

export default Control;
