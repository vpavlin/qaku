import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";

const Status = () => {
    const { dispatcher } = useQakuContext()
    const {status, filterPeers, lightpushPeers, storePeers, node} = useWakuContext()

    return (  
        <div className="text-right h-full items-center p-1 flex justify-end w-full">
            <div onClick={() => {console.log(`LP: ${lightpushPeers}\nF: ${filterPeers}\nS: ${node?.store.connectedPeers.map((p) => p.id)}`)}} className={`grid  place-items-center p-1 rounded-md ${(lightpushPeers.length == 0 || filterPeers.length == 0 || storePeers.length == 0) ? "bg-error text-error-content": "bg-success text-success-content"}`}>Waku Status: {status} (lp: {lightpushPeers.length}, filter: {filterPeers.length}, store: {storePeers.length})</div>  
        </div>
        
           
        
      
    )
}

export default Status;

//            {!dispatcher && <><div className="divider divider-horizontal"></div><div className="grid  place-items-center">loading...</div></>}
