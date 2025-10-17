import { Link } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { Id, HistoryEntry } from "qakulib";

interface IProps {
    id: Id | undefined
}

const HistoryItem = ({ entry, disabled, isActive }: { entry: HistoryEntry; disabled?: boolean; isActive?: boolean }) => {
    const url = entry.password ? `/q/${entry.id}/${entry.password}` : `/q/${entry.id}`
    
    return (
        <Link 
            to={url}
            className={`block px-4 py-2.5 rounded-lg transition-colors group ${
                disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-secondary/50'
            } ${
                isActive ? 'bg-primary/10 border border-primary/20' : ''
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {entry.title || entry.id}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {entry.questionsCnt > 0 && (
                            <span className="px-1.5 py-0.5 bg-accent/20 text-accent rounded">
                                {entry.questionsCnt} Q
                            </span>
                        )}
                        {entry.pollsCnt > 0 && (
                            <span className="px-1.5 py-0.5 bg-accent/20 text-accent rounded">
                                {entry.pollsCnt} P
                            </span>
                        )}
                    </div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.isActive ? 'bg-accent' : 'bg-muted'}`} />
            </div>
        </Link>
    )
}

const History = ({id}: IProps) => {
    const {history, qaku} = useQakuContext()
    
    if (history.length === 0) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">No Q&As yet</div>
    }
    
    return (
        <div className="space-y-1">
            {history.map((entry) => (
                <HistoryItem 
                    key={entry.id} 
                    entry={entry} 
                    disabled={!qaku}
                    isActive={id === entry.id}
                />
            ))}
        </div>
    )
}

export const Admin = () => {
    const {admin, qaku} = useQakuContext()
    
    if (admin.length === 0) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">None</div>
    }
    
    return (
        <div className="space-y-1">
            {admin.slice(0).reverse().map((entry) => (
                <HistoryItem 
                    key={entry.id} 
                    entry={entry} 
                    disabled={!qaku}
                />
            ))}
        </div>
    )
}

export const Visited = () => {
    const {visited, qaku} = useQakuContext()
    
    if (visited.length === 0) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">None</div>
    }
    
    return (
        <div className="space-y-1">
            {visited.slice(0).reverse().map((entry) => (
                <HistoryItem 
                    key={entry.id} 
                    entry={entry} 
                    disabled={!qaku}
                />
            ))}
        </div>
    )
}

export const Participated = () => {
    const {participated, qaku} = useQakuContext()
    
    if (participated.length === 0) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">None</div>
    }
    
    return (
        <div className="space-y-1">
            {participated.slice(0).reverse().map((entry) => (
                <HistoryItem 
                    key={entry.id} 
                    entry={entry} 
                    disabled={!qaku}
                />
            ))}
        </div>
    )
}

export default History;
