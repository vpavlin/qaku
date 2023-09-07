import { useQakuContext } from "../hooks/useQaku";

const Activity = () => {
    const { active, loading } = useQakuContext()
    return (
        <>
        <span>
            Active: {active}
        </span>
        <span>
            {loading && " | loading..."}
        </span>
        </>
    )
}

export default Activity;