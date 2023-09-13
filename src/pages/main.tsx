import { useEffect } from "react";
import NewQA from "../components/new";
import { useWakuContext } from "../hooks/useWaku";
import { Link, Outlet, useParams } from "react-router-dom";
import { QakuContextProvider } from "../hooks/useQaku";
import Control from "../components/control";
import History from "../components/history";
import Status from "../components/status";
import logo from "../assets/logo512.png"
import { HiOutlineMenu } from "react-icons/hi"
import QRCode from "react-qr-code";

const Main = () => {
    const {connected, start} = useWakuContext()
    let { id } = useParams<"id">();

    const link = `${window.location.protocol}//${window.location.host}/q/${id}`
    
    useEffect(() => {
        if (!start || connected) return
        console.log("starting")
        start()
    }, [start])

    return (
        <>
        <QakuContextProvider id={id}>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col items-center justify-center">
                <div className="p-4 text- w-full">
                    <div className="flex bg-accent h-fit rounded-lg items-center p-1 mb-2">
                        <label htmlFor="my-drawer-2" className="btn btn-neutral drawer-button lg:hidden flex-col"><HiOutlineMenu /></label>
                        <Status />
                    </div>
                    
                    <div className="lg:relative">
                        { connected ?
                            id ?
                                <Control id={id} />
                            :
                                <NewQA />
                        :
                            <div></div>
                        }
                        <Outlet />
                        <div className="lg:absolute left-10 top-10 items-center justify-center text-center">
                            <div className="text-2xl">Share this Q&A:</div>
                            <div className="m-2 underline">
                                <a target="_blank" href={link}>{link}</a>
                            </div>
                            <div><QRCode value={link} className="m-auto" /></div>
                            <div><a className="btn m-1" target="_blank" href={`https://twitter.com/intent/tweet?text=${escape(`Come ask your questions at\n\n ${link}`.replaceAll("\\n", "%0a"))}`}>Tweet the Q&A</a></div>
                        </div>
                    </div> 
                    
                </div>
                
                
                </div> 
                <div className="drawer-side">
                    <label htmlFor="my-drawer-2" className="drawer-overlay"></label> 
                    <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
                    <ul>
                            <li><Link to={"/"}>New Q&A</Link></li>
                            <li>
                            <details open>
                                <summary>History</summary>
                                <ul>
                                    <History />
                                </ul>
                            </details>
                            </li>
                    </ul>
                    <div className="m-auto my-10 text-center text-lg font-bold items-center justify-center">
                       
                        <a href="/">
                            <img className="mask mask-circle" src={logo} width={256} />
                            QAKU: Q&A over Waku
                        </a>
                        </div>               
                    </div>

                </div>
            </div>
        </QakuContextProvider>
        
        </>
    )
}

export default Main;