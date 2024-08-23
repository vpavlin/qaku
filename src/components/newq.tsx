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
    const { dispatcher } = useQakuContext()
    const { lightpushPeers } = useWakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const submit = async () => {
        if (!dispatcher || !question) return
        setSubmitState(false)

        const qmsg:QuestionMessage = {question: question, timestamp: new Date()}

        const res = await dispatcher.emit(MessageType.QUESTION_MESSAGE, qmsg)
        if (res) {
            setQuestion("")
        }  else {
            error("Failed to publish question")

        }
        setSubmitState(true)
    }
    return (
        <div className="form-control text-center m-auto max-w-xl">
            Ask your question: 
            <textarea onChange={(e) => setQuestion(e.target.value)} value={question} className="textarea textarea-bordered  bg-neutral w-full h-44 m-auto mb-5"></textarea>
            <button onClick={() => submit()} disabled={!dispatcher || !submitState || lightpushPeers == 0} className="btn btn-lg lg:w-2/4 w-full md:max-w-full m-auto ">
                Submit
            </button>
        </div>
    )
}

export default NewQuestion;