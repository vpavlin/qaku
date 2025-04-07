import { Link } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { Id } from "qakulib";

interface IProps {
    id: Id | undefined
}

const History = ({id}: IProps) => {
    const {history, qaku} = useQakuContext()
    return (
        <>
            {
                history.map((entry) => 
                    <li key={entry.id} className={`m-1`}>
                        <Link className={`${!qaku && "btn-disabled"} ${id && id == entry.id ? "bg-base-content text-base-300 focus:bg-base-content focus:text-base-300 hover:text-base-content" : ""}`} to={`/q/${entry.id}/${entry.password || ""}`}>
                            {entry.title}
                            <span className={`badge ${entry.isActive ?" bg-success text-success-content" : "text-base-content"}`}>{entry.questionsCnt}</span>
                        </Link>
                    </li>
                )
            }
        </>
    )
}

export const Admin = () => {
    const {admin, qaku} = useQakuContext()
    return (
        <>
            {
                admin.slice(0).reverse().map((entry) => 
                    <li key={entry.id} className={`m-1`}>
                        <Link className={`${!qaku && "btn-disabled"}`} to={`/q/${entry.id}/${entry.password || ""}`}>
                            {entry.title}
                            <span className={`badge ${entry.isActive ?" bg-success text-success-content" : "text-base-content"}`}>{entry.questionsCnt}</span>
                        </Link>
                    </li>
                )
            }
        </>
    )
}

export const Visited = () => {
    const {visited, qaku} = useQakuContext()
    return (
        <>
            {
                visited.slice(0).reverse().map((entry) => <li key={entry.id} className="m-1"><Link className={`${!qaku && "btn-disabled"}`} to={`/q/${entry.id}/${entry.password || ""}`}>{entry.title} <span className={`${entry.isActive && "badge bg-success"}`}></span></Link></li>)
            }
        </>
    )
}

export const Participated = () => {
    const {participated, qaku} = useQakuContext()
    return (
        <>
            {
                participated.slice(0).reverse().map((entry) => <li key={entry.id} className="m-1"><Link className={`${!qaku && "btn-disabled"}`} to={`/q/${entry.id}/${entry.password || ""}`}>{entry.title} <span className={`${entry.isActive && "badge bg-success"}`}></span></Link></li>)
            }
        </>
    )
}

export default History;
