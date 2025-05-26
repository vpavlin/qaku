import { useEffect, useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import QRCode from "react-qr-code"
import { QrScanner } from "@yudiel/react-qr-scanner"

const User = () => {
    const { qaku } = useQakuContext()
    const [ key, setKey] = useState<string>()
    const [ timer, setTimer] = useState<number>(0)
    const [ scanner, setScanner] = useState(false)



    return (
        <>
            <div className="w-full m-auto text-center flex-wrap">
            <div className="text-left">Key Management</div>
            <Wallet />
            <div>

                
                <div className="space-x-3">
                 
                        <button className="btn btn-lg" onClick={() => {
                            //setKey(wallet?.privateKey!);
                            (document.getElementById('export_modal') as HTMLDialogElement).showModal()
                            const timeout = 10
                            setTimer(timeout)
                            const i = setInterval(() => setTimer((t) => t-1), 1000)
                            setTimeout(() => {
                                setKey("");
                                clearInterval(i);
                                (document.getElementById('export_modal') as HTMLDialogElement).close()
                            }, timeout* 1000)
                            }}>Export Private Key</button>
             
                  
                        <button className="btn btn-lg" onClick={() => {
                            (document.getElementById('import_modal') as HTMLDialogElement).showModal()
                        }}>Import Private Key</button>
                        
                   
                </div>
            </div>
            </div>
            {qaku?.identity  &&
                <dialog id="export_modal" className="modal">
                    <div className="modal-box text-left">
                        { key && <div>
                                <QRCode value={JSON.stringify({key: key})} className="m-auto border border-white " />
                            </div>}
                        <div className="font-bold text-center text-lg">{ timer > 0 && "Closing in " + timer}</div>
                        <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-sm m-1">Close</button>
                        </form>
                        </div>
                    </div>
                </dialog>
            }
            <dialog id="import_modal" className="modal">
                <div className="modal-box text-left">
                    <div className="p-3 text-lg text-center bg-error text-error-content font-bold">
                    This action will REWRITE existing private key.
                    <br /><br />
                    It will prevent you from accessing previously created Q&As!
                    <br /><br />
                    Use with caution!
                    <br />
                    <button className="btn btn-warning" onClick={() => setScanner(true)}>OK!</button>

                    </div>
                    {scanner && <QrScanner
                        onDecode={(result:string) => /*importPrivateKey(result)*/console.log(result)}
                        onError={(error:any) => console.log(error?.message)}
                    />}
                    <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-sm m-1" onClick={() => setScanner(false)}>Close</button>
                    </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default User

interface IWallet {
    short?: boolean;
}

export const Wallet = ({short}: IWallet) => {
    const { qaku, handleConnectWallet, requestSign, walletConnected, externalAddr, delegationValid } = useQakuContext()
    const [ tooltip, setTooltip] = useState(qaku && qaku.identity && qaku.identity.address()) 

    const addr = short ? (qaku?.identity ? qaku.identity.address().substring(0, 6)+ "..." +qaku.identity.address().substring(qaku.identity.address().length - 4) : "0x....." ) : qaku?.identity?.address()



    const copy = async () => {
        await navigator.clipboard.writeText(qaku?.identity?.address()!);
        setTooltip("Copied to clipboard!")
        setTimeout(() => {
            setTooltip(qaku && qaku.identity && qaku.identity.address())
        }, 2000)
    }
    return (
        <div>
            <div className="tooltip text-center" data-tip={tooltip}>
                <button className="font-bold" onClick={copy}>{addr}</button>
            </div>
            <div className="mt-2">
                {walletConnected && externalAddr ?
                    (!delegationValid ? <button className="btn" onClick={requestSign}>Delegate by {externalAddr}</button> : <span>Delegated by {externalAddr}</span>)
                    :
                     <button className="btn bg-primary" onClick={handleConnectWallet}>Connect External Wallet</button>
                }
            </div>
        </div>
        
    )
}