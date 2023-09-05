import { useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { CONTENT_TOPIC_QUESTIONS } from "../constants";

interface IProps {
    id: string
}

const NewQuestion = ({ id }: IProps) => {
    const {connected, publish} = useWakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const submit = () => {
        if (!connected || !question) return

        setSubmitState(false)
        publish(CONTENT_TOPIC_QUESTIONS(id), question).then((v) => {
            console.log(v)
            setQuestion("")
            
        }).finally(() => setSubmitState(true))

    }
    return (
        <div className="form-control text-center m-auto max-w-md">
            Ask your question: 
            <textarea onChange={(e) => setQuestion(e.target.value)} value={question} className="textarea textarea-bordered w-full max-w-md m-auto mb-1"></textarea>
            <button onClick={() => submit()} disabled={!connected || !submitState} className="btn btn-lg">Submit</button>
        </div>
    )
}

export default NewQuestion;