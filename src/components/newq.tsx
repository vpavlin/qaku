import { useState } from "react";
import { MessageType, QakuMessage, QuestionMessage } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";

interface IProps {
    id: string
}

const NewQuestion = ({ id }: IProps) => {
    const { dispatcher } = useQakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const submit = () => {
        if (!dispatcher || !question) return

        const qmsg:QuestionMessage = {question: question, timestamp: new Date()}

        dispatcher.emit(MessageType.QUESTION_MESSAGE, qmsg).then((v:any) => {
            setQuestion("")
        }).finally(() => setSubmitState(true))
    }
    return (
        <div className="form-control text-center m-auto">
            Ask your question: 
            <textarea onChange={(e) => setQuestion(e.target.value)} value={question} className="textarea textarea-bordered  bg-neutral w-full h-44 m-auto mb-5"></textarea>
            <button onClick={() => submit()} disabled={!dispatcher || !submitState} className="btn btn-lg  lg:w-2/4 w-full md:max-w-full m-auto">Submit</button>
        </div>
    )
}

export default NewQuestion;