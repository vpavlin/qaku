import { useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import ExternalWallet from "./external_wallet";

interface IProps {
    id: string
}

const NewQuestion = ({ id }: IProps) => {
    const { error } = useToastContext()
    const { qaku, externalAddr, walletConnected } = useQakuContext()

    const [submitState, setSubmitState] = useState(true)
    const [question, setQuestion] = useState<string>("")
    const [name, setName] = useState<string>()
    const [useExternal, setUseExternal] = useState(walletConnected)

    const submit = async () => {
        if (!qaku || !question) return
        setSubmitState(false)

        const res = await qaku.newQuestion(id, question, name, useExternal)
        if (res) {
            setQuestion("")
        }  else {
            error("Failed to publish question")

        }
        setSubmitState(true)
    }

    useEffect(() => {
    
    }, [useExternal])
    return (
        <div className="form-control text-center m-auto">
            Ask your question: 
            <textarea onChange={(e) => setQuestion(e.target.value)} value={question} className="textarea textarea-bordered bg-neutral w-full h-44 m-auto mb-5"></textarea>
            <ExternalWallet shouldUseExternal={setUseExternal} setNickname={setName} />
            <button onClick={() => submit()} disabled={!qaku || !submitState} className="btn btn-lg lg:w-2/4 w-full md:max-w-full m-auto ">
                Submit
            </button>
        </div>
    )
}

export default NewQuestion;