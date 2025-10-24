import { useEffect, useState } from "react";
import { CODEX_PUBLIC_URL_STORAGE_KEY, CODEX_URL_STORAGE_KEY, DEFAULT_CODEX_URL, DEFAULT_PUBLIC_CODEX_URL, DEFAULT_WAKU_CLUSTER_ID, DEFAULT_WAKU_SHARD_ID, WAKU_CLUSTER_ID_STORAGE_KEY, WAKU_SHARD_ID, CODEX_AUTO_START_STORAGE_KEY, CODEX_CUSTOM_API_ENDPOINT_KEY } from "../constants";
import User from "./user";
import { Settings as SettingsIcon, Server, Wifi, Save } from "lucide-react";

const Settings = () => {
    const storedCodexURL = localStorage.getItem(CODEX_URL_STORAGE_KEY)
    const storedPublicCodexURL = localStorage.getItem(CODEX_PUBLIC_URL_STORAGE_KEY)
    const storedWakuClusterId = localStorage.getItem(WAKU_CLUSTER_ID_STORAGE_KEY)
    const storedWakuShardId = localStorage.getItem(WAKU_SHARD_ID)

    const [codexURL, setCodexURL] = useState(storedCodexURL || DEFAULT_CODEX_URL)
    const [publicCodexURL, setPublicCodexURL] = useState(storedPublicCodexURL || DEFAULT_PUBLIC_CODEX_URL)
    const [wakuClusterId, setClusterId] = useState(storedWakuClusterId || DEFAULT_WAKU_CLUSTER_ID)
    const [wakuShardId, setShardId] = useState(storedWakuShardId || DEFAULT_WAKU_SHARD_ID)
    const [saved, setSaved] = useState(false)
    
    // Codex management state
    const [autoStartCodex, setAutoStartCodex] = useState<boolean>(
      localStorage.getItem(CODEX_AUTO_START_STORAGE_KEY) === 'true' || true
    )
    const [customApiEndpoint, setCustomApiEndpoint] = useState<string>(
      localStorage.getItem(CODEX_CUSTOM_API_ENDPOINT_KEY) || 'http://localhost:3213'
    )
    const isTauri = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined'

    useEffect(() => {
        localStorage.setItem(CODEX_URL_STORAGE_KEY, codexURL)
        setSaved(true)
        const timer = setTimeout(() => setSaved(false), 2000)
        return () => clearTimeout(timer)
    }, [codexURL])

    useEffect(() => {
        localStorage.setItem(CODEX_PUBLIC_URL_STORAGE_KEY, publicCodexURL)
        setSaved(true)
        const timer = setTimeout(() => setSaved(false), 2000)
        return () => clearTimeout(timer)
    }, [publicCodexURL])

    useEffect(() => {
        localStorage.setItem(WAKU_CLUSTER_ID_STORAGE_KEY, wakuClusterId)
        setSaved(true)
        const timer = setTimeout(() => setSaved(false), 2000)
        return () => clearTimeout(timer)
    }, [wakuClusterId])

    useEffect(() => {
        localStorage.setItem(WAKU_SHARD_ID, wakuShardId)
        setSaved(true)
        const timer = setTimeout(() => setSaved(false), 2000)
        return () => clearTimeout(timer)
    }, [wakuShardId])

    useEffect(() => {
        localStorage.setItem(CODEX_AUTO_START_STORAGE_KEY, autoStartCodex ? 'true' : 'false')
    }, [autoStartCodex])

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Configure your QAKU experience</p>
                    </div>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-sm animate-fade-in">
                        <Save className="w-4 h-4" />
                        Saved
                    </div>
                )}
            </div>

            {/* Network Settings */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <Wifi className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Network Configuration</h2>
                </div>

                {/* Codex Node URL */}
                {!isTauri && 
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <Server className="w-4 h-4" />
                            Codex Node URL
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Used to publish your Q&A snapshots
                        </p>
                        <input 
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" 
                            value={codexURL} 
                            onChange={(e) => setCodexURL(e.target.value)}
                            placeholder="https://codex-node.example.com"
                        />
                    </div>
                }

                {/* Public Codex URL */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Server className="w-4 h-4" />
                        Public Qaku Cache Node URL
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                        Used to pull Q&A snapshots if local node is not available
                    </p>
                    <input 
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" 
                        value={publicCodexURL} 
                        onChange={(e) => setPublicCodexURL(e.target.value)}
                        placeholder="https://public-cache.example.com"
                    />
                </div>

                {/* Waku Cluster ID */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Wifi className="w-4 h-4" />
                        Waku Cluster ID
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                        The Waku Network is <strong>1</strong>
                    </p>
                    <input 
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" 
                        value={wakuClusterId} 
                        onChange={(e) => setClusterId(e.target.value)}
                        placeholder="1"
                    />
                </div>

                {/* Waku Shard ID */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Wifi className="w-4 h-4" />
                        Waku Shard ID
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                        Shard identifier for the Waku network
                    </p>
                    <input 
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" 
                        value={wakuShardId} 
                        onChange={(e) => setShardId(e.target.value)}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Key Management */}
            <User />
            {false && 
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <Server className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Codex Management</h2>
                </div>

                {/* Auto-start Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Auto-start Codex</label>
                        <p className="text-xs text-muted-foreground">
                            Automatically start the local Codex node when Qaku launches
                        </p>
                    </div>
                    <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-border focus:ring-2 focus:ring-ring"
                        checked={autoStartCodex}
                        onChange={(e) => setAutoStartCodex(e.target.checked)}
                        disabled={!isTauri}
                    />
                </div>

                {/* Custom API Endpoint (conditional) */}
                {(!autoStartCodex || !isTauri) && (
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <Server className="w-4 h-4" />
                            Custom REST API Endpoint
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Configure a custom endpoint when not using the built-in Codex node
                        </p>
                        <input
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                            value={customApiEndpoint}
                            onChange={(e) => setCustomApiEndpoint(e.target.value)}
                            placeholder="http://localhost:3213"
                            disabled={autoStartCodex && isTauri}
                        />
                    </div>
                )}
            </div>
            }
        </div>
    )
}

export default Settings;
