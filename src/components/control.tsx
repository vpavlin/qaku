import { useEffect, useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import { DownloadSnapshot } from "../utils/messages"
import { Settings, Power, Camera } from "lucide-react"
import { useToastContext } from "../hooks/useToast"

interface IProps {
    id: string
} 

const Control = ({id}: IProps) => {
    const {controlState, qaku, isOwner, localQuestions, polls, nextPublishTime, codexAvailable} = useQakuContext()
    const {toast} = useToastContext()
    const [enabled, setEnabled] = useState(false)
    const [switching, setSwitching] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState<string>("")

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

    useEffect(() => {
        if (!nextPublishTime) return

        const updateTimeRemaining = () => {
            const now = Date.now()
            const diff = nextPublishTime - now

            if (diff <= 0) {
                setTimeRemaining("Publishing soon...")
                return
            }

            const minutes = Math.floor(diff / 60000)
            const seconds = Math.floor((diff % 60000) / 1000)

            if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s`)
            } else {
                setTimeRemaining(`${seconds}s`)
            }
        }

        updateTimeRemaining()
        const interval = setInterval(updateTimeRemaining, 1000)

        return () => clearInterval(interval)
    }, [nextPublishTime])

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
                        onClick={async () => {
                            const newState = !enabled
                            setSwitching(true)
                            setEnabled(newState) // Update optimistically
                            await qaku?.switchQAState(id, newState)
                            setSwitching(false)
                        }} 
                        disabled={!id || !controlState || switching}
                        className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            enabled 
                                ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
                                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        }`}
                    >
                        {switching ? 'Updating...' : enabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                {(localQuestions.length > 0 || polls.length > 0) && (
                    <div className="space-y-2">
                        <button 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={async () => {
                                setPublishing(true)
                                try {
                                    const result = await qaku?.snapshotManager?.publishSnapshot(id)
                                    if (result) {
                                        toast("Snapshot published successfully", "success")
                                    } else {
                                        toast("Failed to publish snapshot", "error")
                                    }
                                } catch (error) {
                                    console.error("Error publishing snapshot:", error)
                                    toast("Error publishing snapshot: " + (error instanceof Error ? error.message : "Unknown error"), "error")
                                } finally {
                                    setPublishing(false)
                                }
                            }}
                            disabled={publishing || !codexAvailable}
                        >
                            <Camera className="w-4 h-4" />
                            {publishing ? 'Publishing...' : !codexAvailable ? 'Codex Unavailable' : 'Publish Snapshot'}
                        </button>
                        {timeRemaining && codexAvailable && (
                            <div className="text-xs text-muted-foreground text-center">
                                Next auto-publish in {timeRemaining}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Control;
