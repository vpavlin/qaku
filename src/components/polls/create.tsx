import { useState } from "react"
import { useQakuContext } from "../../hooks/useQaku"
import { useToastContext } from "../../hooks/useToast"
import { Id, PollOption } from "qakulib"
import { BarChart3, Plus, X, Send } from "lucide-react"
import Collapsible from "../Collapsible"

interface IOptionProps {
    title: string
    index: number
    setOption: (index: number, text: string) => void
    removeOption: (index: number) => void
}

const CreatePollOption = ({title, index, setOption, removeOption}: IOptionProps) => {
    return (
        <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                Option {index + 1}
            </span>
            <input 
                type="text" 
                className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm" 
                value={title} 
                onChange={(e) => setOption(index, e.target.value)}
                placeholder={`Enter option ${index + 1}`}
            />
            <button 
                onClick={() => removeOption(index)}
                className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

interface IProps {
    id: Id
}

const CreatePoll = ({id}: IProps) => {
    const {qaku} = useQakuContext()
    const {info, error} = useToastContext()

    const [options, setOptions] = useState<PollOption[]>([])
    const [title, setTitle] = useState<string>("")
    const [question, setQuestion] = useState<string>("")
    const [active, setActive] = useState<boolean>(false)
    const [collapsed, setCollapsed] = useState<boolean>(true)
    const [submitting, setSubmitting] = useState<boolean>(false)

    const handleOptionChange = (index: number, title: string) => {
        setOptions((o) => {
            const newOptions = [...o]
            newOptions[index].title = title
            return newOptions
        })
    }

    const handleRemoveOption = (index: number) => {
        setOptions((o) => o.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (qaku === undefined || qaku.identity === undefined) return

        if (options.length < 2) {
            error("Please provide at least 2 options")
            return
        }
        if (!question || question.length === 0) {
            error("Please enter a question")
            return
        }

        setSubmitting(true)

        const res = await qaku.newPoll(id, {
            active: active,
            options: options,
            question: question,
            title: title,
            id: "",
        })
 
        if (!res) {
            setSubmitting(false)
            error("Failed to publish poll")
            return 
        }

        info(`Successfully published poll ${title || question}`)
        setCollapsed(true)
        setQuestion("")
        setTitle("")
        setOptions([])
        setActive(false)
        setSubmitting(false)
    }

    return (
        <Collapsible
            title="Create Poll"
            icon={<BarChart3 className="w-5 h-5 text-primary" />}
            isOpen={!collapsed}
            onToggle={() => setCollapsed(!collapsed)}
        >
                    {/* Title (optional) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">
                            Title <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Feature Priority Vote"
                        />
                    </div>

                    {/* Question */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">
                            Question <span className="text-destructive">*</span>
                        </label>
                        <textarea 
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y" 
                            value={question} 
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="What question do you want to ask?"
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium">
                            Options <span className="text-destructive">*</span>
                        </label>
                        <div className="space-y-2">
                            {options.map((o, i) => (
                                <CreatePollOption 
                                    key={i}
                                    title={o.title} 
                                    index={i} 
                                    setOption={handleOptionChange}
                                    removeOption={handleRemoveOption}
                                />
                            ))}
                        </div>
                        <button 
                            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
                            onClick={() => setOptions((o) => [...o, {title: ""}])}
                        >
                            <Plus className="w-4 h-4" />
                            Add Option
                        </button>
                    </div>

                    {/* Active toggle */}
                    <label className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="font-medium group-hover:text-primary transition-colors">
                                Active immediately
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Start accepting votes right away
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-border bg-input checked:bg-primary checked:border-primary focus:ring-2 focus:ring-ring"
                            checked={active} 
                            onChange={(e) => setActive(e.target.checked)}
                        />
                    </label>

                    {/* Submit */}
                    <button 
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        disabled={submitting || options.length < 2 || !question}
                        onClick={() => handleSubmit()}
                    >
                        <Send className="w-4 h-4" />
                        {submitting ? 'Publishing...' : 'Publish Poll'}
                    </button>
        </Collapsible>
    )
}

export default CreatePoll;
