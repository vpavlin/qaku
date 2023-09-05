import { useEffect } from "react";
import NewQA from "../components/new";
import { useWakuContext } from "../hooks/useWaku";
import { Outlet, useParams } from "react-router-dom";
import { QakuContextProvider } from "../hooks/useQaku";
import Control from "../components/control";

const Main = () => {
    const {connected, status, start, publish} = useWakuContext()
    let { id } = useParams<"id">();
    
    useEffect(() => {
        if (!start || connected) return
        console.log("starting")
        start()
    }, [start])

    return (
        <div className="p-4 text-s text-gray-600">
            <div className="text-right bg-slate-100 p-1">
                Waku Status: {status}
            </div>
            <QakuContextProvider id={id}>
            { connected ?
                 id ?
                    
                    <Control id={id} />
                : 
                    <NewQA />
            :
                <div></div>
            }
            <Outlet />
            </QakuContextProvider>
            
        </div>
    )
}

export default Main;