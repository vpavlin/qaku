import { useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import ExternalWallet from "./external_wallet";
import { MessageSquarePlus, Send } from "lucide-react";
import Collapsible from "./Collapsible";

interface IProps {
    id: string
    isOwner?: boolean
}

const NewQuestion = ({ id, isOwner = false }: IProps) => {
    const { error } = useToastContext()
    const { qaku, externalAddr, walletConnected } = useQakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const [name, setName] = useState<string>()
    const [useExternal, setUseExternal] = useState(walletConnected)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(isOwner)

    useEffect(() => {
        setIsCollapsed(isOwner)
    }, [isOwner])

    const submit = async () => {
        if (!qaku || !question) return
        setSubmitState(false)

        const res = await qaku.newQuestion(id, question, name, useExternal)
        if (res) {
            setQuestion("")
        } else {
            error("Failed to publish question")
        }
        setSubmitState(true)
    }

    useEffect(() => {
    }, [useExternal])

    return (
        <Collapsible
            title="Ask a Question"
            icon={<MessageSquarePlus className="w-5 h-5 text-primary" />}
            isOpen={!isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
        >
            <div className="space-y-4">
                    <div>
                        <textarea
                            onChange={(e) => setQuestion(e.target.value)}
                            value={question}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[120px] resize-y"
                            placeholder="What would you like to ask?"
                        />
                    </div>

                    <ExternalWallet shouldUseExternal={setUseExternal} setNickname={setName} />

                    <button
                        onClick={() => submit()}
                        disabled={!qaku || !submitState || !question.trim()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-4 h-4" />
                        {submitState ? 'Submit Question' : 'Submitting...'}
                    </button>
                </div>
        </Collapsible>
    )
}

export default NewQuestion;
