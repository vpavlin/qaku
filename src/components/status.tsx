import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";

const Status = () => {
    const { active, loading } = useQakuContext()
    const {status} = useWakuContext()

    return (  
        <div className="text-right h-full items-center p-1 flex justify-end w-full">
            <div className="grid  place-items-center">Waku Status: {status}</div>  
            <div className="divider divider-horizontal"></div>  
            <div className="grid  place-items-center">Active: {active}</div>
            {loading && <><div className="divider divider-horizontal"></div><div className="grid  place-items-center">loading...</div></>}
        </div>
        
           
        
      
    )
}

export default Status;