import { useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import QRCode from "react-qr-code"
import { QrScanner } from "@yudiel/react-qr-scanner"

const User = () => {
    const { wallet, importPrivateKey, getHistory } = useQakuContext()
    const [ tooltip, setTooltip] = useState(wallet && wallet.address) 
    const [ key, setKey] = useState<string>()
    const [ timer, setTimer] = useState<number>(0)
    const [ scanner, setScanner] = useState(false)

    const copy = async () => {
        await navigator.clipboard.writeText(wallet?.address!);
        setTooltip("Copied to clipboard!")
        setTimeout(() => {
            setTooltip(wallet && wallet.address)
        }, 2000)
    }

    return (
        <>
            <ul className="text-center">
            <li className="tooltip" data-tip={tooltip}>
                <button className="font-bold" onClick={copy}>{wallet ? wallet.address.slice(0, 7)+"..."+wallet.address.slice(wallet.address.length - 5) : "0x......."}</button>
            </li>
            <li>
                <details>
                <summary>Key Management</summary>
                <ul>
                    <li>
                        <button className="text-center" onClick={() => {
                            setKey(wallet?.privateKey!);
                            (document.getElementById('export_modal') as HTMLDialogElement).showModal()
                            setTimer(5)
                            const i = setInterval(() => setTimer((t) => t-1), 1000)
                            setTimeout(() => {
                                setKey("");
                                clearInterval(i);
                                (document.getElementById('export_modal') as HTMLDialogElement).close()
                            }, 5000)
                            }}>Export Private Key</button>
                    </li>
                    <li>
                        <button className="text-center" onClick={() => {
                            (document.getElementById('import_modal') as HTMLDialogElement).showModal()
                        }}>Import Private Key</button>
                        
                    </li>
                </ul>
                </details>
            </li>
            </ul>
            {wallet  &&
                <dialog id="export_modal" className="modal">
                    <div className="modal-box text-left">
                        { key && <QRCode value={JSON.stringify({key: key, history: getHistory()})} className="m-auto" />}
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
                        onDecode={(result:string) => importPrivateKey(result)}
                        onError={(error:any) => console.log(error?.message)}
                    />}
                    <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-sm m-1">Close</button>
                    </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default User