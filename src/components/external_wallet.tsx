import { useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";
import { Wallet, User, Check } from "lucide-react";

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
            <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                    <input 
                        type="checkbox" 
                        checked={useExternal} 
                        className="sr-only peer" 
                        disabled={!walletConnected} 
                        onChange={(e) => setUseExternal(e.target.checked)} 
                    />
                    <div className="mt-0.5 sm:mt-1 w-5 h-5 rounded border-2 border-border bg-input peer-checked:bg-primary peer-checked:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-all flex items-center justify-center">
                        {useExternal && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium group-hover:text-primary transition-colors">
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
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary/30 border border-border rounded-lg min-w-0">
                    <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-mono text-xs sm:text-sm truncate min-w-0">{externalAddr}</span>
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
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm sm:text-base" 
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary/30 border border-border rounded-lg min-w-0">
                        <User className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-mono text-xs sm:text-sm truncate min-w-0">{qaku?.identity?.address()}</span>
                    </div>
                )
            )}
        </div>
    )
}

export default ExternalWallet;
