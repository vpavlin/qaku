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
                    <div className="text-right pl-1 mb-1 border border-base-300/50 rounded-lg w-full p-3 self-end bg-base-100/30"> 
                <ReactMarkdown className="font-medium text-base-content" children={data.content} />
                <div className="flex justify-end items-center">
                    {qaku && qaku.identity && !data.likers.find(l => l == qaku.identity!.address()) &&
                        <span className="items-center cursor-pointer m-1 hover:bg-base-300/50 p-1 rounded transition-colors" onClick={() => upvote(data.id, UpvoteType.ANSWER, questionId)}>
                            <PiThumbsUpLight size={20} className="text-base-content/60" />
                        </span>
                    }
                    <span className="text-base-content/60 text-sm">answered by {controlState?.owner == data.author && "owner: "}{controlState?.admins.includes(data.author!) && "admin: "}{data.delegationInfo ? name : shortAddr(data.author!)}</span>
                    <span className="border rounded-md px-2 py-0.5 mx-1 text-base-content/80 border-base-300/50 bg-base-200/30 text-sm">{data.likesCount}</span>
                </div>
            </div>
        </>
    )
}

export default Answer;