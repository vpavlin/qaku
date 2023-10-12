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
    const { wallet } = useQakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const submit = () => {
        if (!connected || !question || !wallet) return

        const qmsg:QuestionMessage = {question: question, timestamp: new Date()}
        const msg:QakuMessage = {payload: JSON.stringify(qmsg), signer: wallet.address, signature: undefined, type: MessageType.QUESTION_MESSAGE}
        setSubmitState(false)
        publish(CONTENT_TOPIC_MAIN(id), JSON.stringify(msg)).then((v) => {
            setQuestion("")
            
        }).finally(() => setSubmitState(true))

    }
    return (
        <div className="form-control text-center m-auto">
            Ask your question: 
            <textarea onChange={(e) => setQuestion(e.target.value)} value={question} className="textarea textarea-bordered  bg-neutral w-full h-44 m-auto mb-5"></textarea>
            <button onClick={() => submit()} disabled={!connected || !submitState} className="btn btn-lg  lg:w-2/4 w-full md:max-w-full m-auto">Submit</button>
        </div>
    )
}

export default NewQuestion;