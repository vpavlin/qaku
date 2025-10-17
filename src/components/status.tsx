import { useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";
import { HealthStatus } from "@waku/interfaces"

const Status = () => {
    const { codexAvailable } = useQakuContext()
    const { health } = useWakuContext()
    const [healthStatus, setHealthStatus] = useState<"error" | "warning" | "success">("error")
    
    const version = "v0.1.0" // From package.json

    useEffect(() => {
        if (!health) return

        switch (health) {
            case HealthStatus.Unhealthy:
                setHealthStatus("error")
                break;
            case HealthStatus.MinimallyHealthy:
                setHealthStatus("warning")
                break;
            case HealthStatus.SufficientlyHealthy:
                setHealthStatus("success")
                break;
            default:
                console.log("Unknown state:", health)
                break;
        }
    }, [health])

    const getStatusColor = (status: "error" | "warning" | "success") => {
        switch (status) {
            case "error":
                return "bg-destructive"
            case "warning":
                return "bg-orange"
            case "success":
                return "bg-accent"
            default:
                return "bg-muted"
        }
    }

    const getStatusLabel = (status: "error" | "warning" | "success") => {
        switch (status) {
            case "error":
                return "Disconnected"
            case "warning":
                return "Connecting"
            case "success":
                return "Connected"
            default:
                return "Unknown"
        }
    }

    return (
        <div className="flex items-center gap-3">
            {/* Version */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-xs font-mono text-muted-foreground">{version}</span>
            </div>

            {/* Waku Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(healthStatus)} ${healthStatus === "success" ? "animate-pulse" : ""}`} />
                    <span className="text-xs font-medium">Waku</span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                    {getStatusLabel(healthStatus)}
                </span>
            </div>

            {/* Codex Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${codexAvailable ? "bg-accent animate-pulse" : "bg-destructive"}`} />
                    <span className="text-xs font-medium">Codex</span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                    {codexAvailable ? "Available" : "Unavailable"}
                </span>
            </div>
        </div>
    )
}

export default Status;
