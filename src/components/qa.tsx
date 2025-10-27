import NewQuestion from "./newq";
import { useQakuContext } from "../hooks/useQaku";
import Question from "./question";
import CreatePoll from "./polls/create";
import { useEffect, useState } from "react";
import Polls from "./polls/poll";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { User, Lock, AlertTriangle, ArrowUpDown, Filter, MessageSquarePlus } from "lucide-react";
import { QuestionSort, QuestionShow, EnhancedQuestionMessage } from "qakulib";
import LogoSpinner from "./logo-spinner";

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
    
    // Sorting and filtering state
    const [sortBy, setSortBy] = useState<QuestionSort>(QuestionSort.UPVOTES_DESC)
    const [filterBy, setFilterBy] = useState<QuestionShow>(QuestionShow.ALL)
    const [filteredQuestions, setFilteredQuestions] = useState<EnhancedQuestionMessage[]>([])

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

    // Update filtered questions when sort/filter changes
    useEffect(() => {
        if (!qaku || !id) return
        
        try {
            const questions = qaku.getQuestions(id, [sortBy], [filterBy]).filter((msg) => filterBy === QuestionShow.MODERATED || (isAdmin || isOwner || !msg.moderated))
            setFilteredQuestions(questions)
        } catch (e) {
            console.error("Failed to get questions:", e)
        }
    }, [qaku, id, sortBy, filterBy, localQuestions])

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
                    <LogoSpinner />
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

                {controlState.moderation && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Moderated session - questions may be hidden by the owner</span>
                    </div>
                )}
            </div>

            {/* New Question Form */}
            {controlState.enabled && (
                <NewQuestion id={controlState.id} isOwner={isOwner} />
            )}

            {/* Create Poll (Owner/Admin only) */}
            {(isOwner || isAdmin) && (
                <CreatePoll id={controlState.id} />
            )}

            {/* Tabs & Controls */}
            <div className="space-y-4">
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

                {/* Sort & Filter Controls (only show for Questions tab) */}
                {activeTab === Tabs.Questions && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Sort Control */}
                            <div className="flex items-center gap-2 flex-1">
                                <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as QuestionSort)}
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                >
                                    <option value={QuestionSort.UPVOTES_DESC}>Most Upvoted</option>
                                    <option value={QuestionSort.UPVOTES_ASC}>Least Upvoted</option>
                                    <option value={QuestionSort.TIME_DESC}>Newest First</option>
                                    <option value={QuestionSort.TIME_ASC}>Oldest First</option>
                                    <option value={QuestionSort.ANSWERED_DESC}>Answered First</option>
                                    <option value={QuestionSort.ANSWERED_ASC}>Unanswered First</option>
                                </select>
                            </div>

                            {/* Filter Control */}
                            <div className="flex items-center gap-2 flex-1">
                                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <select
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value as QuestionShow)}
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                >
                                    <option value={QuestionShow.ALL}>All Questions</option>
                                    <option value={QuestionShow.ANSWERED}>Answered Only</option>
                                    <option value={QuestionShow.UNANSWERED}>Unanswered Only</option>
                                    <option value={QuestionShow.MODERATED}>Moderated Only</option>
                                </select>
                            </div>
                        </div>

                        {/* Question count badge */}
                        <div className="flex items-center justify-center sm:justify-start px-3 py-2 bg-secondary/50 rounded-lg text-sm">
                            <span className="text-muted-foreground">
                                Showing: <span className="font-semibold text-foreground">{filteredQuestions.length}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div>
                {activeTab === Tabs.Questions && (
                    <div className="space-y-4">
                        {filteredQuestions.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <p className="text-muted-foreground">
                                    {localQuestions.length === 0 
                                        ? "No questions yet. Be the first to ask!"
                                        : "No questions match the selected filters."
                                    }
                                </p>
                            </div>
                        ) : (
                            filteredQuestions
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
