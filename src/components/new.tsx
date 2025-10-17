import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";
import { useToastContext } from "../hooks/useToast";
import ExternalWallet from "./external_wallet";
import { Check } from "lucide-react";

const NewQA = () => {
    const { error } = useToastContext()
    const { node, connected } = useWakuContext()
    const { qaku, walletConnected } = useQakuContext()
    const navigate = useNavigate();

    const [title, setTitle] = useState<string>()
    const [desc, setDesc] = useState<string>()
    const [enabled, setEnabled] = useState<boolean>(true)
    const [moderation, SetModeration] = useState<boolean>(false)
    const [password, setPassword] = useState<string>()
    const [admins, setAdmins] = useState<string[]>([])
    const [useExternal, setUseExternal] = useState(walletConnected)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        console.log("Submitting...", qaku)
        if (!qaku || !node || !title) return

        setSubmitting(true)
        console.log("Doing something")
        const id = await qaku.newQA(title, desc, enabled, admins, moderation, password, useExternal)
        await qaku.initQA(id, password)

        if (id) {
            if (password) {
                navigate("/q/"+id+"/"+password, {flushSync: true})
            } else {
                navigate("/q/"+id)
            }
        } else {
            error("Failed to create the Q&A")
            setSubmitting(false)
        }
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
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Create New Q&A</h1>
                <p className="text-muted-foreground">
                    Set up a new Q&A session for your audience to ask questions
                </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium">
                        Title <span className="text-destructive">*</span>
                    </label>
                    <input 
                        id="title"
                        type="text" 
                        name="title" 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="e.g., Town Hall Meeting Q&A"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium">
                        Description
                    </label>
                    <textarea 
                        id="description"
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[100px] resize-y"
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="What is this Q&A about?"
                    />
                </div>

                {/* Options */}
                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Options
                    </h3>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex-shrink-0">
                            <input 
                                type="checkbox" 
                                checked={enabled} 
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="mt-1 w-5 h-5 rounded border-2 border-border bg-input peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                {enabled && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="font-medium group-hover:text-primary transition-colors">
                                Enable immediately
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Start accepting questions right away
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex-shrink-0">
                            <input 
                                type="checkbox" 
                                checked={moderation} 
                                onChange={(e) => SetModeration(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="mt-1 w-5 h-5 rounded border-2 border-border bg-input peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                {moderation && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="font-medium group-hover:text-primary transition-colors">
                                Owner moderation
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Manually approve questions before they appear
                            </div>
                        </div>
                    </label>
                </div>

                {/* Password */}
                <div className="space-y-2 pt-4 border-t border-border">
                    <label htmlFor="password" className="block text-sm font-medium">
                        Password (optional)
                    </label>
                    <div className="flex gap-2">
                        <input 
                            id="password"
                            type="text" 
                            name="password" 
                            value={password || ''} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="flex-1 px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            placeholder="For encrypted Q&As"
                        />
                        <button 
                            type="button"
                            className="px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors whitespace-nowrap"
                            onClick={() => setPassword(Math.random().toString(36).slice(2, 8))}
                        >
                            Generate
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Set a password to encrypt the Q&A session
                    </p>
                </div>

                {/* Admins */}
                <div className="space-y-2">
                    <label htmlFor="admins" className="block text-sm font-medium">
                        Admin Addresses
                    </label>
                    <textarea 
                        id="admins"
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[80px] resize-y font-mono text-sm"
                        onChange={(e) => setAdmins(e.target.value.split("\n"))}
                        placeholder="0x123...&#10;0x456...&#10;(one address per line)"
                    />
                    <p className="text-xs text-muted-foreground">
                        List wallet addresses that can moderate this Q&A (one per line)
                    </p>
                </div>

                {/* External Wallet */}
                <div className="pt-4 border-t border-border">
                    <ExternalWallet shouldUseExternal={setUseExternal} />
                </div>

                {/* Submit */}
                <button 
                    onClick={() => submit()}  
                    disabled={!qaku || !title || submitting} 
                    className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
                >
                    {submitting ? 'Creating...' : !qaku ? 'Initializing...' : !title ? 'Enter a title to continue' : 'Create Q&A Session'}
                </button>
            </div>
        </div>
    )
}

export default NewQA;
