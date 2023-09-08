import { useEffect } from "react";
import NewQA from "../components/new";
import { useWakuContext } from "../hooks/useWaku";
import { Outlet, useParams } from "react-router-dom";
import { QakuContextProvider } from "../hooks/useQaku";
import Control from "../components/control";
import Activity from "../components/active";
import logo from "../assets/logo192.png"

const Main = () => {
    const {connected, status, start, publish} = useWakuContext()
    let { id } = useParams<"id">();
    
    useEffect(() => {
        if (!start || connected) return
        console.log("starting")
        start()
    }, [start])

    return (
        <div className="p-4 text-s text-gray-600 flex flex-col">
            <QakuContextProvider id={id}>
                <div className="text-right bg-slate-100 p-1 mb-2">
                    Waku Status: {status}
                    &nbsp;|&nbsp;
                    <Activity />
                </div>
                <div className="">
                    { connected ?
                        id ?
                            <Control id={id} />
                        :
                            <NewQA />
                    :
                        <div></div>
                    }
                    <Outlet />
                </div>
            </QakuContextProvider>
            <div className="m-auto my-10 text-center text-lg font-bold"><a href="/"><img className="mask mask-circle" src={logo} />QAKU: Q&A over Waku</a></div>
        </div>
    )
}

export default Main;