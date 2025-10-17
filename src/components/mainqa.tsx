import QRCode from "react-qr-code";
import { useParams } from "react-router-dom";
import Control from "./control";
import NewQA from "./new"
import QA from "./qa"
import { useWakuContext } from "../hooks/useWaku";
import { useQakuContext } from "../hooks/useQaku";
import { Share2, Twitter } from "lucide-react";
import { useState } from "react";

const MainQA = () => {
    let { id } = useParams<"id">();
    let { password } = useParams<"password">();
    const {connected} = useWakuContext()
    const {loading} = useQakuContext()
    const [showShare, setShowShare] = useState(false)

    let link = `${window.location.protocol}//${window.location.host}/a/${id}`

    if (password) {
        link = `${link}/${password}`
    }

    if (!connected) {
        return (
            <div className="h-[calc(100vh-200px)] w-full flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Connecting to network...</p>
                </div>
            </div>
        )
    }

    return ( 
        <div className="max-w-7xl mx-auto">
            {!id && <NewQA />}
            
            {id && (
                <div className="grid lg:grid-cols-[1fr_300px] gap-6">
                    {/* Main Content */}
                    <div className="min-w-0">
                        <QA />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Share Card */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Share2 className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">Share Q&A</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-center p-4 bg-background rounded-lg">
                                    <QRCode 
                                        value={link} 
                                        size={180}
                                        className="w-full h-auto"
                                        fgColor="hsl(var(--foreground))"
                                        bgColor="hsl(var(--background))"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Attendee Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={link} 
                                            readOnly 
                                            className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
                                        />
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(link)
                                            }}
                                            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <a 
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Come ask your questions at\n\n${link}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
                                >
                                    <Twitter className="w-4 h-4" />
                                    Share on Twitter
                                </a>
                            </div>
                        </div>

                        {/* Control Panel */}
                        <Control id={id} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default MainQA;
