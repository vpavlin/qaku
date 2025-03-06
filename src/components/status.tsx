import { useCallback, useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";
import {HealthStatus, HealthStatusChangeEvents} from "@waku/interfaces"

const Status = () => {
    const { dispatcher, codexAvailable } = useQakuContext()
    const {status, filterPeers, storePeers, node} = useWakuContext()
    const [health, setHealthStyle] = useState("error")

    const healthStyle:any = {
        "error": "bg-error text-error-content",
        "warning": "bg-warning text-warning-content",
        "success": "bg-success text-success-content"
    }


   useEffect(() => {
    if (!node) return

    const h = node?.health.addEventListener(HealthStatusChangeEvents.StatusChange, (hs) => {
        console.log(hs)
        
        let st = "error"

        switch (hs.detail) {
            case HealthStatus.Unhealthy:
                st = "error"
                break;
            case HealthStatus.MinimallyHealthy:
                st = "warning"
                break;
            case HealthStatus.SufficientlyHealthy:
                st = "success"
                break;
            default:
                console.log("Unknown state:", h)
                break;
        }

        setHealthStyle(st)
    })

   }, [node])

    return (  
        <div className="text-right h-full items-center p-1 flex justify-end space-x-2 w-full">
            <div className={`grid  place-items-center p-1 rounded-md ${healthStyle[health]}`}>Waku</div> 
            <div className={`grid  place-items-center p-1 rounded-md ${codexAvailable ? "bg-success text-success-content" : "bg-error text-error-content"}`}>Codex</div> 
        </div> 
    )
}

export default Status;

//            {!dispatcher && <><div className="divider divider-horizontal"></div><div className="grid  place-items-center">loading...</div></>}
