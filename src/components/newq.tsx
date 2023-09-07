import { useState } from "react";
import { useWakuContext } from "../hooks/useWaku";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { MessageType, QakuMessage, QuestionMessage } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";

interface IProps {
    id: string
}

const NewQuestion = ({ id }: IProps) => {
    const {connected, publish} = useWakuContext()
    const { pubKey } = useQakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const submit = () => {
        if (!connected || !question || !pubKey) return

        const qmsg:QuestionMessage = {question: question, timestamp: new Date()}
        const msg:QakuMessage = {payload: JSON.stringify(qmsg), signer: pubKey, signature: undefined, type: MessageType.QUESTION_MESSAGE}
        setSubmitState(false)
        publish(CONTENT_TOPIC_MAIN(id), JSON.stringify(msg)).then((v) => {
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