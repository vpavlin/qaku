import { useEffect, useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import { useWakuContext } from "../hooks/useWaku"

interface IProps {
    id: string
}

const Control = ({id}: IProps) => {
    const {controlState, switchState, isOwner} = useQakuContext()
    const [enabled, setEnabled] = useState(false)
    
    const {connected, publish} = useWakuContext()

    useEffect(() => {
        if (!controlState) return
        setEnabled(controlState.enabled)
        
    }, [controlState])
    return (
        <>
            { isOwner &&
                
                <div className="m-auto max-w-md text-center">
                    {controlState && <>
                        <h1 className="font-bold">{controlState.title} ({ enabled ? "enabled" : "disabled"})</h1>
                        <div><button onClick={() => switchState(!enabled)} disabled={!id || !controlState} className={`btn`}>{ enabled ? "disable" : "enable"}</button></div>
                    </>
                    }
                </div>
            }
        </>
    )
}

export default Control;