import QRCode from "react-qr-code";
import { useParams } from "react-router-dom";
import Control from "./control";
import NewQA from "./new"
import QA from "./qa"
import { useWakuContext } from "../hooks/useWaku";
import { useQakuContext } from "../hooks/useQaku";

const MainQA = () => {
    let { id } = useParams<"id">();
    let { password } = useParams<"password">();
    const {connected} = useWakuContext()
    const {loading} = useQakuContext()

    let link = `${window.location.protocol}//${window.location.host}/q/${id}`

    if (password) {
        link = `${link}/${password}`
    }
    return ( 
    <div className="lg:relative lg:h-full">
        { connected ?
            !id && <NewQA />
        :
           <div className="h-full w-full flex justify-center items-center">
                <div className="loading loading-lg"></div>
            </div>
        }
        <QA />
        { id &&
            <div className="min-[1750px]:absolute left-10 top-10 items-center justify-center text-center">
                <div className="text-2xl">Share this Q&A:</div>
                <div className="m-2 underline">
                    <a target="_blank" href={link}>{link}</a>
                </div>
                <div className="m-auto w-fit border-4 border-white"><QRCode value={link} className="m-auto" /></div>
                <div><a className="btn m-1" target="_blank" href={`https://twitter.com/intent/tweet?text=${escape(`Come ask your questions at\n\n ${link}`.replaceAll("\\n", "%0a"))}`}>Tweet the Q&A</a></div>
                <Control id={id} />
            </div>
        }
    </div> )
}

export default MainQA;