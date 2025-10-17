import { useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { Wallet, User } from "lucide-react";

interface iProps {
    shouldUseExternal: (useExternal: boolean) => void
    setNickname?: (name: string | undefined) => void 
}

const ExternalWallet = ({shouldUseExternal, setNickname}: iProps) => {
    const { qaku, externalAddr, walletConnected } = useQakuContext()
    const [useExternal, setUseExternal] = useState(walletConnected)
    const [name, setName] = useState<string>()
    const [useNickname, setUseNickname] = useState(false)

    useEffect(() => {
        shouldUseExternal(useExternal)
    }, [useExternal])

    useEffect(() => {
        if (setNickname)
            setNickname(name?.trim())
    }, [name, setNickname])

    useEffect(() => {
        if (typeof setNickname === 'function')
            setUseNickname(true)
    }, [setNickname])

    return (
        <div className="space-y-3">
            {/* External Wallet Toggle */}
            <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                    type="checkbox" 
                    checked={useExternal} 
                    className="mt-1 w-4 h-4 rounded border-border bg-input checked:bg-primary checked:border-primary focus:ring-2 focus:ring-ring" 
                    disabled={!walletConnected} 
                    onChange={(e) => setUseExternal(e.target.checked)} 
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span className="font-medium group-hover:text-primary transition-colors">
                            Use external wallet
                        </span>
                    </div>
                    {!walletConnected && (
                        <div className="text-xs text-muted-foreground mt-1">
                            Connect your wallet to use this feature
                        </div>
                    )}
                </div>
            </label>

            {/* Identity Display */}
            {useExternal ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border border-border rounded-lg">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="font-mono text-sm">{externalAddr}</span>
                </div>
            ) : (
                useNickname ? (
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <User className="w-4 h-4" />
                            Nickname (optional)
                        </label>
                        <input 
                            type="text" 
                            onChange={(e) => setName(e.target.value)} 
                            value={name || ''} 
                            placeholder="Your nickname" 
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border border-border rounded-lg">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-mono text-sm">{qaku?.identity?.address()}</span>
                    </div>
                )
            )}
        </div>
    )
}

export default ExternalWallet;
