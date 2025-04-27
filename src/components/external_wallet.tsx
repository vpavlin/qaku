import { useEffect, useState } from "react";
import { useQakuContext } from "../hooks/useQaku";


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
        <div>
            <label className="label items-start justify-start space-x-2">
            <input type="checkbox" checked={useExternal} className="checkbox" disabled={!walletConnected} onChange={(e) => setUseExternal(e.target.checked)} />
                <span className="label-text text-left">Use external wallet</span>
            </label>
            {useExternal ? 
                <span className="text -left border rounded-lg p-2 border-base-100 m-2">{externalAddr}</span> 
                : 
                useNickname  ? <input type="text" onChange={(e) => setName(e.target.value)} value={name} placeholder="Your nickname" className="input input-bordered" /> : qaku?.identity?.address()
            }
        </div>
    )
}

export default ExternalWallet;