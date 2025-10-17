import { useEffect, useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { QakuContextProvider, useQakuContext } from "../hooks/useQaku";
import History, { Visited, Participated, Admin } from "../components/history";
import Status from "../components/status";
import logo from "../assets/logo512.png"
import { HiChevronDoubleRight, HiOutlineMenu, HiX } from "react-icons/hi"
import User, { Wallet } from "../components/user";
import { useToastContext } from "../hooks/useToast";

const Main = () => {
    const {Element, toast} = useToastContext()
    const {connected, start} = useWakuContext()
    let { id } = useParams<"id">();
    let { password } = useParams<"password">();
    const [ searchId, setSearchId ] = useState<string>()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navigate = useNavigate();

    useEffect(() => {
        if (!start || connected) return
        start()
    }, [start, connected])

    return (
        <>
        <QakuContextProvider id={id} password={password} updateStatus={toast}>
            <div className="flex min-h-screen w-full bg-background">
                {/* Mobile Header */}
                <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        {sidebarOpen ? <HiX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
                    </button>
                    <Status />
                </div>

                {/* Sidebar Overlay for mobile */}
                {sidebarOpen && (
                    <div 
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed lg:sticky top-0 left-0 h-screen z-40
                    w-[280px] bg-card border-r border-border
                    flex flex-col overflow-y-auto
                    transition-transform duration-200 ease-smooth
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    {/* Logo */}
                    <Link 
                        to="/" 
                        className="flex flex-col items-center py-8 px-6 border-b border-border"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <img className="w-20 h-20 rounded-full mb-3" src={logo} alt="QAKU Logo" />
                        <h1 className="text-2xl font-bold font-mono text-primary">QAKU</h1>
                        <p className="text-xs text-muted-foreground mt-1">Q&A powered by Waku</p>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-6">
                        {/* New Q&A */}
                        <Link 
                            to="/" 
                            onClick={() => setSidebarOpen(false)}
                            className="block px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            + New Q&A
                        </Link>

                        {/* Your Q&As */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                                Your Q&As
                            </h3>
                            <div onClick={() => setSidebarOpen(false)}>
                                <History id={id} />
                            </div>
                        </div>

                        {/* Admin Q&As */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                                Admin Q&As
                            </h3>
                            <div onClick={() => setSidebarOpen(false)}>
                                <Admin />
                            </div>
                        </div>

                        {/* Participated */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                                Participated
                            </h3>
                            <div onClick={() => setSidebarOpen(false)}>
                                <Participated />
                            </div>
                        </div>

                        {/* Visited */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                                Visited
                            </h3>
                            <div onClick={() => setSidebarOpen(false)}>
                                <Visited />
                            </div>
                        </div>

                        {/* Go To Q&A */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">
                                Go To Q&A
                            </h3>
                            <div className="flex gap-2 px-4">
                                <input 
                                    type="text" 
                                    className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                                    placeholder="Q&A ID" 
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchId) {
                                            navigate(`/q/${searchId}`)
                                            setSidebarOpen(false)
                                        }
                                    }}
                                />
                                <button 
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                    onClick={() => {
                                        if (searchId) {
                                            navigate(`/q/${searchId}`)
                                            setSidebarOpen(false)
                                        }
                                    }}
                                >
                                    <HiChevronDoubleRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-border p-4 space-y-4">
                        <div className="px-4">
                            <div className="text-xs text-muted-foreground mb-2">Connected Wallet</div>
                            <Wallet short={true} />
                        </div>
                        <Link 
                            to="/settings" 
                            onClick={() => setSidebarOpen(false)}
                            className="block px-4 py-2 text-center border border-border rounded-lg hover:bg-secondary transition-colors"
                        >
                            Settings
                        </Link>
                        <div className="flex gap-4 justify-center text-sm">
                            <a href="https://github.com/vpavlin/qaku" className="text-muted-foreground hover:text-foreground transition-colors">
                                Github
                            </a>
                            <a href="https://twitter.com/vpavlin" className="text-muted-foreground hover:text-foreground transition-colors">
                                Twitter
                            </a>
                            <a href="https://waku.org/" className="text-muted-foreground hover:text-foreground transition-colors">
                                Waku
                            </a>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 pt-16 lg:pt-0">
                    <div className="hidden lg:flex items-center justify-end px-6 py-4 border-b border-border">
                        <Status />
                    </div>
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
            <Element />
        </QakuContextProvider>
        </>
    )
}

export default Main;
