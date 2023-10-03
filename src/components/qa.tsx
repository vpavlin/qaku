import NewQuestion from "./newq";
import { useEffect, useState } from "react";

import { AnsweredMessage, MessageType, QakuMessage, QuestionMessage, UpvoteMessage, unique } from "../utils/messages";
import { useQakuContext } from "../hooks/useQaku";
import { sha256 } from "js-sha256";
import { CONTENT_TOPIC_MAIN } from "../constants";
import { useWakuContext } from "../hooks/useWaku";
import { PiThumbsUpLight} from "react-icons/pi";
import ReactMarkdown from "react-markdown";

type EnhancedQuestionMessage = {
    question: string;
    timestamp: Date;
    answer: string | undefined;
    answered: boolean;
    upvotes: number;
    upvotedByMe: boolean;
}

const QA = () => {

    const  { controlState, questions, isAnswered, isOwner, wallet, upvoted, msgEvents } = useQakuContext()
    const {connected, publish} = useWakuContext()
    const [localQuestions, setLocalQuestions] = useState<EnhancedQuestionMessage[]>([])
    const [ answer, setAnswer ] = useState<string>()
    const [ download, setDownload ] = useState<string>()


    const publishAnswer =  async (qmsg:QuestionMessage, answer?: string) => {
        if (!wallet || !connected || !controlState) return
        const hash = sha256(JSON.stringify(qmsg))

        const amsg:AnsweredMessage = { hash: hash, text: answer }
        const msg:QakuMessage = {payload: JSON.stringify(amsg), type: MessageType.ANSWERED_MESSAGE, signer: wallet.address, signature: undefined}


        const sig = wallet.signMessageSync(JSON.stringify(amsg))
        if (!sig) return

        msg.signature = sig
        const result = await publish(CONTENT_TOPIC_MAIN(controlState.id), JSON.stringify(msg))

        if (!result || result.error) console.log(result)
    }

    const upvote = async (qmsg: QuestionMessage) => {
        if (!wallet || !connected || !controlState) return
        
        const hash = sha256(JSON.stringify(qmsg))

        const amsg:UpvoteMessage = {hash: hash}
        const msg:QakuMessage = {payload: JSON.stringify(amsg), type: MessageType.UPVOTE_MESSAGE, signer: wallet.address, signature: undefined}

        const sig = wallet.signMessageSync(JSON.stringify(amsg))
        if (!sig) return

        msg.signature = sig
        const result = await publish(CONTENT_TOPIC_MAIN(controlState.id), JSON.stringify(msg))

        if (!result || result.error) console.log(result)
    }

    const saveTemplateAsFile = (filename:string, dataObjToWrite:EnhancedQuestionMessage[]) => {
        const blob = new Blob([JSON.stringify(dataObjToWrite, null, 2)], { type: "text/json" });
        const link = document.createElement("a");

        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

        const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });

        link.dispatchEvent(evt);
        link.remove()
    };

    useEffect(() => {
        if (!questions) return

        const lq = questions.slice(0)

        setLocalQuestions(lq.map((q)=> {
            const [u, upvoters] = upvoted(q)
            const [answered, answerMsg] = isAnswered(q)

            const lq: EnhancedQuestionMessage = {question: q.question, timestamp: q.timestamp, answer: answerMsg && answerMsg.text, answered: answered, upvotes: u, upvotedByMe: !!(upvoters && wallet && upvoters.indexOf(wallet.address) >= 0)}
            return lq
        }).sort((a:EnhancedQuestionMessage, b:EnhancedQuestionMessage) => {
            
            if (a.answered && b.answered) return b.upvotes - a.upvotes
            if (a.answered && !b.answered) return 1
            if (!a.answered && b.answered) return -1

            return b.upvotes - a.upvotes
        }))

    }, [questions, msgEvents])
    
    return (
        <div className="mt-5 text-center max-w-2xl m-auto">
            { controlState &&
                <div>Owner: {controlState.owner.slice(0, 7)+"..."+controlState.owner.slice(controlState.owner.length-5)}</div>
            }
            <div className="mb-5">
                { localQuestions.length > 0 && isOwner && <button className="btn" onClick={()=> saveTemplateAsFile("data.json", localQuestions)}>Download</button>}
            </div>
            <h2 className="text-2xl">{controlState?.title}</h2>
            { controlState && controlState?.enabled &&
                <NewQuestion id={controlState.id} />
            }
            {
                localQuestions.map((msg, i) => {
                    const d = new Date(msg.timestamp)
                    const formatter = new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric',  });

                    return <div key={i.toString()} className={`border rounded-xl p-3 my-2 focus:shadow-md hover:shadow-md hover:-mx-1 hover:transition-all ${msg.answered && "opacity-60 bg-success text-success-content"} hover:opacity-100`}>
                        <div className="text-left">
                            <ReactMarkdown children={msg.question} />
                        </div>
                        { msg.answer && <div className="text-right pl-2 mb-2 font-bold border-t border-white"> <ReactMarkdown children={msg.answer!} /></div>}
                        <div className={`text-right text-sm flex gap-x-2 justify-end items-center`}>
                            <div className="font-bold items-center flex">
                            {!isOwner && !msg.answered && !msg.upvotedByMe &&
                                <span className="items-center cursor-pointer m-1 hover:bg-secondary p-1 hover:rounded-lg" onClick={() => upvote({question: msg.question, timestamp: msg.timestamp})}>
                                    <PiThumbsUpLight size={25} className="" />
                                </span>
                            } <span className={`bg-secondary border rounded-md p-1 text-secondary-content border-secondary ${msg.answered && "bg-primary"}`}>{msg.upvotes}</span>
                            </div>
                            {isOwner && !msg.answered &&
                                <div>
                                    <button className="btn btn-sm mx-1" onClick={() => {
                                        setAnswer("");
                                        (document.getElementById('answer_modal') as HTMLDialogElement).showModal()
                                        }}>Answer</button>
                                    <dialog id="answer_modal" className="modal">
                                        <div className="modal-box text-left">
                                            <div className="text-left m-2"><ReactMarkdown>{msg.question}</ReactMarkdown></div>
                                            <div className="font-bold m-1">Answer</div>
                                            <textarea onChange={(e) => setAnswer(e.target.value)} value={answer} className="textarea textarea-bordered w-full h-44 m-auto mb-1"></textarea>
                                            <div className="modal-action">
                                            <form method="dialog">
                                                <button className="btn btn-sm m-1" onClick={() => publishAnswer({question: msg.question, timestamp: msg.timestamp}, answer)}>Submit</button>
                                                <button className="btn btn-sm m-1">Close</button>
                                            </form>
                                            </div>
                                        </div>
                                    </dialog>
                                </div>
                            }
                            <div className="bg-secondary border rounded-md p-1 text-secondary-content border-secondary">
                                {`${formatter.format(d)}`}
                            </div>
                        </div>
                        
                    </div>
})
            }
        </div>
    )
}

export default QA;