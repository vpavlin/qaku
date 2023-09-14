import { Link } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";

const History = () => {
    const {getHistory} = useQakuContext()
    return (
        <>
            {
                getHistory().map((entry) => <li key={entry.id} className="m-1"><Link to={`/q/${entry.id}/`}>{entry.title}</Link></li>)
            }
        </>
    )
}

export const Visited = () => {
    const {visited} = useQakuContext()
    return (
        <>
            {
                visited.slice(0).reverse().map((entry) => <li key={entry.id} className="m-1"><Link to={`/q/${entry.id}/`}>{entry.title}</Link></li>)
            }
        </>
    )
}

export default History;
