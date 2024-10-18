import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";

const Status = () => {
    const { dispatcher } = useQakuContext()
    const {status, filterPeers, storePeers, node} = useWakuContext()

    return (  
        <div className="text-right h-full items-center p-1 flex justify-end w-full">
            <div onClick={() => {console.log(`F: ${filterPeers}\nS: ${node?.store.connectedPeers.map((p) => p.id)}`)}} className={`grid  place-items-center p-1 rounded-md ${(filterPeers.length == 0 || storePeers.length == 0) ? "bg-error text-error-content": "bg-success text-success-content"}`}>Waku Status: {status} (filter: {filterPeers.length}, store: {storePeers.length})</div>  
        </div>
        
           
        
      
    )
}

export default Status;

//            {!dispatcher && <><div className="divider divider-horizontal"></div><div className="grid  place-items-center">loading...</div></>}
