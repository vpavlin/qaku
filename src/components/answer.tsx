import { AnswerType, UpvoteType } from "qakulib";
import { PiThumbsUpLight } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { useQakuContext } from "../hooks/useQaku";
import { shortAddr } from "../utils/crypto";
import { useState } from "react";

interface iProps {
    questionId: string
    data: AnswerType
    upvote: (id: string, type: UpvoteType, questionId: string) => void
}

const Answer = ({questionId, data, upvote}: iProps) => {
    const {qaku, controlState} = useQakuContext()

    const [name, setName] = useState<string>()

    if (!name && data.delegationInfo && qaku) {
        qaku.externalWallet?.getName(data.delegationInfo.externalAddress).then(name => setName(name || shortAddr(data.delegationInfo!.externalAddress))).catch(e => setName(shortAddr(data.author)))
    }

    return (
        <>
                    <div className="text-right pl-1 mb-1 border border-white rounded-lg w-full p-1  self-end"> 
                <ReactMarkdown className="font-bold" children={data.content} /> 
                <div className="flex justify-end items-center">
                    {qaku && qaku.identity && !data.likers.find(l => l == qaku.identity!.address()) &&
                        <span className="items-center cursor-pointer m-1 hover:bg-primary p-1 hover:rounded-lg" onClick={() => upvote(data.id, UpvoteType.ANSWER, questionId)}>
                            <PiThumbsUpLight size={25} className="" />
                        </span>
                    }
                    (answered by {controlState?.owner == data.author && "owner: "}{controlState?.admins.includes(data.author!) && "admin: "}{data.delegationInfo ? name : shortAddr(data.author!)})
                    <span className={` border rounded-md px-1 mx-1 text-primary-content border-primary}`}>{data.likesCount}</span>
                </div>
            </div>
        </>
    )
}

export default Answer;