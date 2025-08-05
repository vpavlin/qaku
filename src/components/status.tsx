import { useCallback, useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";
import {HealthStatus} from "@waku/interfaces"

const Status = () => {
    const { codexAvailable } = useQakuContext()
    const {health} = useWakuContext()
    const [healthStyle, setHealthStyle] = useState("error")

    const healthStyleMap:any = {
        "error": "bg-error text-error-content",
        "warning": "bg-warning text-warning-content",
        "success": "bg-success text-success-content"
    }


   useEffect(() => {
    if (!health) return

        let st = "error"

        switch (health) {
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
                console.log("Unknown state:", health)
                break;
        }
        setHealthStyle(st)

   }, [health])

    return (  
        <div className="text-right h-full items-center p-1 flex justify-end space-x-2 w-full">
            <div className={`grid  place-items-center p-1 rounded-md ${healthStyleMap[healthStyle]}`}>Waku</div> 
            <div className={`grid  place-items-center p-1 rounded-md ${codexAvailable ? "bg-success text-success-content" : "bg-error text-error-content"}`}>Codex</div> 
        </div> 
    )
}

export default Status;

//            {!dispatcher && <><div className="divider divider-horizontal"></div><div className="grid  place-items-center">loading...</div></>}
