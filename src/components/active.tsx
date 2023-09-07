import { useQakuContext } from "../hooks/useQaku";

const Activity = () => {
    const { active } = useQakuContext()
    return (
        <span>
            Active: {active}
        </span>
    )
}

export default Activity;