import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";
import Question from "./question";
import CreatePoll from "./polls/create";
import { useEffect, useState } from "react";
import Polls from "./polls/poll";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { User, Lock, AlertTriangle } from "lucide-react";

enum Tabs {
    Questions = "questions",
    Polls = "polls"
}

const QA = () => {
    const { controlState, localQuestions, qaku, isOwner, isAdmin, polls, ready } = useQakuContext()
    const {hash} = useLocation()
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Questions)
    let { id } = useParams<"id">();
    let { password } = useParams<"password">();

    const [needsPassword, setNeedsPassword] = useState<boolean>()
    const [passwordInput, setPasswordInput] = useState<string>()
    const [ownerENS, setOwnerENS] = useState<string>()

    useEffect(() => {
        switch(hash) {
            case "#"+Tabs.Polls:
                setActiveTab(Tabs.Polls)
                break;
            case "#"+Tabs.Questions:
                setActiveTab(Tabs.Questions)
                break
            default:
                setActiveTab(Tabs.Questions)
        }
    }, [hash])

    useEffect(() => {
        setNeedsPassword(!(password || (id && !id.startsWith("X"))))
    }, [id, password])

    useEffect(() => {
        if (controlState && controlState.delegationInfo) {
            qaku?.externalWallet?.getName(controlState.delegationInfo.externalAddress).then(name => {
                name && setOwnerENS(name)
            }).catch(e => console.debug(e))
        }
    }, [controlState, ready, qaku])

    if (needsPassword) {
        return (
            <div className="max-w-md mx-auto mt-16">
                <div className="bg-card border border-border rounded-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Protected Q&A</h2>
                        <p className="text-muted-foreground">
                            This session requires a password to access
                        </p>
                    </div>
                    <div className="space-y-3">
                        <input 
                            type="password"
                            placeholder="Enter password"
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && passwordInput && navigate(`/q/${id}/${passwordInput}`)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button 
                            onClick={() => passwordInput && navigate(`/q/${id}/${passwordInput}`)}
                            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Unlock Session
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!ready) {
        return (
            <div className="h-64 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Loading Q&A session...</p>
                </div>
            </div>
        )
    }

    if (!controlState) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                {controlState.moderation && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <div className="font-semibold text-destructive mb-1">Moderated Session</div>
                            <div className="text-muted-foreground">
                                Questions can be hidden by the owner
                            </div>
                        </div>
                    </div>
                )}

                <h1 className="text-3xl md:text-4xl font-bold mb-4">{controlState.title}</h1>
                
                {controlState.description && (
                    <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                        {controlState.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium font-mono">
                            {ownerENS || `${controlState.owner.slice(0, 7)}...${controlState.owner.slice(-5)}`}
                        </span>
                    </div>
                    {isOwner && (
                        <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm font-medium">
                            Owner
                        </span>
                    )}
                    {isAdmin && !isOwner && (
                        <span className="px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-sm font-medium">
                            Admin
                        </span>
                    )}
                </div>
            </div>

            {/* New Question Form */}
            {controlState.enabled && (
                <NewQuestion id={controlState.id} />
            )}

            {/* Create Poll (Owner/Admin only) */}
            {(isOwner || isAdmin) && (
                <CreatePoll id={controlState.id} />
            )}

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-6">
                    <button
                        onClick={() => {
                            setActiveTab(Tabs.Questions)
                            navigate(`#${Tabs.Questions}`)
                        }}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            activeTab === Tabs.Questions
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Questions ({localQuestions.length})
                        {activeTab === Tabs.Questions && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab(Tabs.Polls)
                            navigate(`#${Tabs.Polls}`)
                        }}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            activeTab === Tabs.Polls
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Polls ({polls.length})
                        {activeTab === Tabs.Polls && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div>
                {activeTab === Tabs.Questions && (
                    <div className="space-y-4">
                        {localQuestions.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <p className="text-muted-foreground">
                                    No questions yet. Be the first to ask!
                                </p>
                            </div>
                        ) : (
                            localQuestions
                                .filter((msg) => isAdmin || isOwner || !msg.moderated)
                                .map((msg, i) => (
                                    <Question 
                                        id={controlState.id} 
                                        moderation={controlState.moderation} 
                                        msg={msg} 
                                        key={i.toString()} 
                                    />
                                ))
                        )}
                    </div>
                )}
                {activeTab === Tabs.Polls && (
                    <Polls id={controlState.id} />
                )}
            </div>
        </div>
    )
}

export default QA;
