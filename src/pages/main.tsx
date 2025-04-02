import { useEffect, useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { QakuContextProvider, useQakuContext } from "../hooks/useQaku";
import History, { Visited, Participated } from "../components/history";
import Status from "../components/status";
import logo from "../assets/logo512.png"
import { HiChevronDoubleRight, HiOutlineMenu } from "react-icons/hi"
import User, { Wallet } from "../components/user";
import { useToastContext } from "../hooks/useToast";

const Main = () => {
    const {Element, toast} = useToastContext()
    const {connected, start} = useWakuContext()
    let { id } = useParams<"id">();
    let { password } = useParams<"password">();
    const [ searchId, setSearchId ] = useState<string>()

    const [drawer, setDrawer] = useState(false)

    const navigate = useNavigate();

    
    useEffect(() => {
        if (!start || connected) return
        start()
    }, [start, connected])


    return (
        <>
        <QakuContextProvider id={id} password={password} updateStatus={toast}>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-2" type="checkbox" className="drawer-toggle" checked={drawer} />
                <div className="drawer-content flex justify-center">
                <div className="w-full">
                    <div className="flex bg-base-100 h-fit rounded-lg items-center p-1 mb-2 lg:absolute lg:right-0">
                        <label htmlFor="my-drawer-2" className="btn btn-neutral drawer-button lg:hidden flex-col" onClick={() => setDrawer(!drawer)}><HiOutlineMenu /></label>
                        <Status />
                    </div>
                    
                   <Outlet />
                    
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
                                    <summary>Participated Q&As</summary>
                                    <ul onClick={() => setDrawer(!drawer)}>
                                        <Participated />
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
                        <div className="w-full m-auto text-center flex-wrap">
                            <Wallet short={true} />
                        </div>
                        <div className="divider"></div>
                        <button className="btn btn-lg"><Link to="/settings">Settings</Link></button>
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