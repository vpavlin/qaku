import { useState } from "react"
import { useQakuContext } from "../../hooks/useQaku"
import { sha256 } from "js-sha256"
import { MessageType } from "../../utils/messages"
import { useToastContext } from "../../hooks/useToast"
import { PollOption } from "qakulib"


interface IOptionProps {
    title: string
    index: number
    setOption: (index: number, text: string) => void
}

const CreatePollOption = ({title, index, setOption}:IOptionProps) => {

    return (<>
        <div>
            <label className="label">
                <span className="min-w-[100px]">Option {index+1}</span>
                <input type="text" className="input input-bordered" value={title} onChange={(e) => setOption(index, e.target.value)} />
            </label>
        </div>
    </>)
}


const CreatePoll = () => {

    const {qaku} = useQakuContext()
    const {info, error} = useToastContext()

    const [options, setOptions] = useState<PollOption[]>([])
    const [title, setTitle] = useState<string>()
    const [question, setQuestion] = useState<string>()
    const [active, setActive] = useState<boolean>(false)

    const [collapsed, setCollapsed] = useState<boolean>(false)

    const [submitting, setSubmitting] = useState<boolean>(false)

    const handleOptionChange = (index:number, title:string) => {
        setOptions((o) => {
            if (title == "") return o
            o[index].title = title;
            return [...o]
        })
    }

    const handleSubmit = async () => {
        if (qaku === undefined || qaku.identity === undefined) return

        if (options.length < 2) {
            error("Too few options, please provide at least 2")
            return //FIXME
        }
        if (!question || question.length == 0) {
            error("You need to ask something!")
            return
        }

        setSubmitting(true)

        const res = await qaku.newPoll({
            active: active,
            options: options,
            question: question,
            title: title,
            id: "",
        })
 
        if (!res) {
            error("Failed to publish poll")
            return 
        }
        

        info(`Successfully published a poll ${title}`)
        setCollapsed(true)
        setQuestion("")
        setTitle("")
        setOptions([])
        setActive(false)

        setSubmitting(false)
    }

    return (
        <>  
            <div className="collapse collapse-arrow border border-base-100 my-5">
                <input type="checkbox" checked={collapsed} onChange={(e) => {console.log(e.target.checked);setCollapsed(e.target.checked)}} />
                <div className="collapse-title">Add Poll</div>
                <div className="bg-neutral collapse-content">
                    <label className="label">
                        <span>Title (optional)</span>
                        <input type="text" className="input input-bordered" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label className="label block text-left">
                        <div>Question</div>
                        <textarea className="input input-bordered w-full min-h-[14rem]" value={question} onChange={(e) => setQuestion(e.target.value)}></textarea>
                    </label>
                    <label className="label">
                        <span>Active</span>
                        <input type="checkbox" className="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}/>
                    </label>
                    <div className="bg-base-100 p-3 shadow m-3">
                        <span>Options:</span>
                        <div>{
                            options.map((o, i) => 
                                <CreatePollOption title={o.title} index={i} setOption={handleOptionChange}/>
                            )
                        }</div>
                        <div><button className="btn btn-lg" onClick={() => setOptions((o) => [...o, {title: ""}])}>+</button></div>
                    </div>
                    <div>
                        <button className={`btn btn-lg`} disabled={submitting} onClick={() => handleSubmit()}>Submit</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CreatePoll;