import { useEffect, useState } from "react";
import NewQA from "../components/new";
import { useWakuContext } from "../hooks/useWaku";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { QakuContextProvider } from "../hooks/useQaku";
import Control from "../components/control";
import History, { Visited } from "../components/history";
import Status from "../components/status";
import logo from "../assets/logo512.png"
import { HiChevronDoubleRight, HiOutlineMenu } from "react-icons/hi"
import QRCode from "react-qr-code";
import User from "../components/user";
import { useToastContext } from "../hooks/useToast";

const Main = () => {
    const {Element} = useToastContext()
    const {connected, start, filterPeers, lightpushPeers, storePeers} = useWakuContext()
    let { id } = useParams<"id">();
    const [ searchId, setSearchId ] = useState<string>()

    const [drawer, setDrawer] = useState(false)

    const navigate = useNavigate();
    
    const link = `${window.location.protocol}//${window.location.host}/q/${id}`
    
    useEffect(() => {
        if (!start || connected) return
        start()
    }, [start, connected])

    return (
        <>
        <QakuContextProvider id={id}>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-2" type="checkbox" className="drawer-toggle" checked={drawer} />
                <div className="drawer-content flex justify-center">
                <div className="w-full">
                    <div className="flex bg-base-100 h-fit rounded-lg items-center p-1 mb-2 lg:absolute lg:right-0">
                        <label htmlFor="my-drawer-2" className="btn btn-neutral drawer-button lg:hidden flex-col" onClick={() => setDrawer(!drawer)}><HiOutlineMenu /></label>
                        <Status />
                    </div>
                    
                    <div className="lg:relative lg:h-full">
                        { connected ?
                            !id && <NewQA />
                        :
                            <div className="h-full w-full flex justify-center items-center">
                                <div className="loading loading-lg"></div>
                            </div>
                        }
                        <Outlet />
                        { id &&
                            <div className="min-[1750px]:absolute left-10 top-10 items-center justify-center text-center">
                                <div className="text-2xl">Share this Q&A:</div>
                                <div className="m-2 underline">
                                    <a target="_blank" href={link}>{link}</a>
                                </div>
                                <div className="m-auto w-fit border-4 border-white"><QRCode value={link} className="m-auto" /></div>
                                <div><a className="btn m-1" target="_blank" href={`https://twitter.com/intent/tweet?text=${escape(`Come ask your questions at\n\n ${link}`.replaceAll("\\n", "%0a"))}`}>Tweet the Q&A</a></div>
                                <Control id={id} />
                            </div>
                        }
                    </div> 
                    
                </div>
                
                
                </div> 
                <div className="drawer-side">
                    <label htmlFor="my-drawer-2" className="drawer-overlay" onClick={() => setDrawer(!drawer)}></label> 
                    <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
                        <ul>
                                <li onClick={() => setDrawer(!drawer)}><Link to={"/"}>New Q&A</Link></li>
                                <li>
                                <details open>
                                    <summary>Your Q&As</summary>
                                    <ul onClick={() => setDrawer(!drawer)}>
                                        <History />
                                    </ul>
                                </details>
                                <details>
                                    <summary>Visited Q&As</summary>
                                    <ul onClick={() => setDrawer(!drawer)}>
                                        <Visited />
                                    </ul>
                                </details>
                                </li>
                        </ul>
                        <div className="divider">Go To</div>
                        <div className="flex mx-auto items-center place-items-center align-middle">
                            <input type="text" className="input flex-col" placeholder="Q&A ID" size={10} onChange={(e) => setSearchId(e.target.value)} />
                            <div className="btn mx-2 h-full flex-col bg-base-300" onClick={() => searchId && navigate(`/q/${searchId}`)}><HiChevronDoubleRight size={22} /></div>
                        </div>
                        <div className="divider">User</div>
                        <div>
                        <User />
                        </div>
                        <div className="divider"></div>
                        <div className="m-auto text-center text-lg font-bold items-center justify-center">
                            <Link to="/">
                                <img className="mask mask-circle" src={logo} width={256} />
                                <div>QAKU</div>
                                <div className="text-sm">Q&A power by Waku</div>
                            </Link>
                        </div>
                        <div className="divider"></div>
                        <ul className="menu">
                            <li><a href="https://github.com/vpavlin/qaku">Github</a></li>
                            <li><a href="https://twitter.com/vpavlin">Twitter</a></li>
                            <li><a href="https://waku.org/">Waku</a></li>
                        </ul>
                    </div>

                </div>
            </div>
            <Element />
        </QakuContextProvider>
        
        </>
    )
}

export default Main;