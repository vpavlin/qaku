import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";

const Status = () => {
    const { dispatcher } = useQakuContext()
    const {status, filterPeers, lightpushPeers, storePeers} = useWakuContext()

    return (  
        <div className="text-right h-full items-center p-1 flex justify-end w-full">
            <div className={`grid  place-items-center p-1 rounded-md ${(lightpushPeers == 0 || filterPeers == 0 || storePeers == 0) ? "bg-error text-error-content": "bg-success text-success-content"}`}>Waku Status: {status} (lp: {lightpushPeers}, filter: {filterPeers}, store: {storePeers})</div>  
        </div>
        
           
        
      
    )
}

export default Status;

//            {!dispatcher && <><div className="divider divider-horizontal"></div><div className="grid  place-items-center">loading...</div></>}
