import { useState } from "react";
import { MessageType, QakuMessage, QuestionMessage } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";
import { useWakuContext } from "../hooks/useWaku";
import { useToastContext } from "../hooks/useToast";

interface IProps {
    id: string
}

const NewQuestion = ({ id }: IProps) => {
    const { error } = useToastContext()
    const { qaku } = useQakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const submit = async () => {
        if (!qaku || !question) return
        setSubmitState(false)

        const res = await qaku.newQuestion(id, question)
        if (res) {
            setQuestion("")
        }  else {
            error("Failed to publish question")

        }
        setSubmitState(true)
    }
    return (
        <div className="form-control text-center m-auto">
            Ask your question: 
            <textarea onChange={(e) => setQuestion(e.target.value)} value={question} className="textarea textarea-bordered bg-neutral w-full h-44 m-auto mb-5"></textarea>
            <button onClick={() => submit()} disabled={!qaku || !submitState} className="btn btn-lg lg:w-2/4 w-full md:max-w-full m-auto ">
                Submit
            </button>
        </div>
    )
}

export default NewQuestion;