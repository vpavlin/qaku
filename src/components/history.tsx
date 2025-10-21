import { Link, useNavigate } from "react-router-dom";
import { useQakuContext } from "../hooks/useQaku";
import { Id, HistoryEntry } from "qakulib";
import { Trash2 } from "lucide-react";

interface IProps {
    id: Id | undefined
}

const HistoryItem = ({ entry, disabled, isActive, onDelete }: { entry: HistoryEntry; disabled?: boolean; isActive?: boolean; onDelete?: (id: string) => void }) => {
    const url = entry.password ? `/q/${entry.id}/${entry.password}` : `/q/${entry.id}`
    
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete && confirm(`Delete "${entry.title || entry.id}"?`)) {
            onDelete(entry.id);
        }
    };
    
    return (
        <div className="relative group/item">
            <Link 
                to={url}
                className={`block px-4 py-2.5 rounded-lg transition-colors group ${
                    disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-secondary/50'
                } ${
                    isActive ? 'bg-primary/10 border border-primary/20' : ''
                }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-6">
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
            {onDelete && !disabled && (
                <button
                    onClick={handleDelete}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive"
                    aria-label="Delete Q&A"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

const History = ({id}: IProps) => {
    const {history, qaku} = useQakuContext()
    const navigate = useNavigate();
    
    const handleDelete = (deletedId: string) => {
        qaku?.history.delete(deletedId);
        if (id === deletedId) {
            navigate('/');
        }
    };
    
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
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}

export const Admin = () => {
    const {admin, qaku} = useQakuContext()
    const navigate = useNavigate();
    
    const handleDelete = (deletedId: string) => {
        qaku?.history.delete(deletedId);
        if (window.location.pathname.includes(deletedId)) {
            navigate('/');
        }
    };
    
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
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}

export const Visited = () => {
    const {visited, qaku} = useQakuContext()
    const navigate = useNavigate();
    
    const handleDelete = (deletedId: string) => {
        qaku?.history.delete(deletedId);
        if (window.location.pathname.includes(deletedId)) {
            navigate('/');
        }
    };
    
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
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}

export const Participated = () => {
    const {participated, qaku} = useQakuContext()
    const navigate = useNavigate();
    
    const handleDelete = (deletedId: string) => {
        qaku?.history.delete(deletedId);
        if (window.location.pathname.includes(deletedId)) {
            navigate('/');
        }
    };
    
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
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}

export default History;
