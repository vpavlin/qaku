import { useState } from "react"
import { useQakuContext } from "../hooks/useQaku"
import QRCode from "react-qr-code"
import { QrScanner } from "@yudiel/react-qr-scanner"
import { Key, Download, Upload, Wallet as WalletIcon, Copy, Check, X, AlertTriangle } from "lucide-react"

const User = () => {
    const { qaku } = useQakuContext()
    const [ key, setKey] = useState<string>()
    const [ timer, setTimer] = useState<number>(0)
    const [ scanner, setScanner] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)

    const handleExport = () => {
        setShowExportModal(true)
        const timeout = 10
        setTimer(timeout)
        const i = setInterval(() => setTimer((t) => t-1), 1000)
        setTimeout(() => {
            setKey("")
            clearInterval(i)
            setShowExportModal(false)
        }, timeout * 1000)
    }

    return (
        <>
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <Key className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Key Management</h2>
                </div>

                {/* Wallet Display */}
                <Wallet />

                {/* Key Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4" />
                        Export Private Key
                    </button>
                    <button 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
                        onClick={() => setShowImportModal(true)}
                    >
                        <Upload className="w-4 h-4" />
                        Import Private Key
                    </button>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && qaku?.identity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Export Private Key</h3>
                                <button 
                                    onClick={() => setShowExportModal(false)}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {key && (
                                <div className="flex items-center justify-center p-4 bg-background rounded-lg">
                                    <QRCode 
                                        value={JSON.stringify({key: key})} 
                                        size={220}
                                        fgColor="hsl(var(--foreground))"
                                        bgColor="hsl(var(--background))"
                                    />
                                </div>
                            )}

                            <div className="text-center">
                                <div className="text-2xl font-bold text-destructive">
                                    {timer > 0 && `Closing in ${timer}s`}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Scan this QR code to backup your private key
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Import Private Key</h3>
                                <button 
                                    onClick={() => {
                                        setShowImportModal(false)
                                        setScanner(false)
                                    }}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {!scanner && (
                                <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg space-y-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                                        <div className="text-sm space-y-2">
                                            <p className="font-semibold text-destructive">Warning: This action will overwrite your existing private key!</p>
                                            <p className="text-muted-foreground">
                                                Importing a new key will prevent you from accessing previously created Q&As.
                                            </p>
                                            <p className="text-muted-foreground">
                                                Make sure you have backed up your current key before proceeding.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        className="w-full px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
                                        onClick={() => setScanner(true)}
                                    >
                                        I Understand, Proceed
                                    </button>
                                </div>
                            )}

                            {scanner && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Scan QR code containing your private key
                                    </p>
                                    <div className="rounded-lg overflow-hidden">
                                        <QrScanner
                                            onDecode={(result:string) => console.log(result)}
                                            onError={(error:any) => console.log(error?.message)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default User

interface IWallet {
    short?: boolean;
}

export const Wallet = ({short}: IWallet) => {
    const { qaku, handleConnectWallet, requestSign, walletConnected, externalAddr, delegationValid } = useQakuContext()
    const [ copied, setCopied] = useState(false)

    const addr = short 
        ? (qaku?.identity ? `${qaku.identity.address().substring(0, 6)}...${qaku.identity.address().substring(qaku.identity.address().length - 4)}` : "0x.....") 
        : qaku?.identity?.address()

    const copy = async () => {
        await navigator.clipboard.writeText(qaku?.identity?.address()!)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-4">
            {/* Internal Wallet Address */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                    Your QAKU Address
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-secondary/30 border border-border rounded-lg font-mono text-sm">
                        {addr}
                    </div>
                    <button 
                        onClick={copy}
                        className="px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* External Wallet Connection */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                    External Wallet
                </label>
                {walletConnected && externalAddr ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/20 rounded-lg">
                            <WalletIcon className="w-4 h-4 text-accent" />
                            <span className="font-mono text-sm">{externalAddr.substring(0, 6)}...{externalAddr.substring(externalAddr.length - 4)}</span>
                        </div>
                        {!delegationValid ? (
                            <button 
                                onClick={requestSign}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Sign Delegation
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-accent/20 text-accent rounded-lg text-sm font-medium">
                                <Check className="w-4 h-4" />
                                Delegation Active
                            </div>
                        )}
                    </div>
                ) : (
                    <button 
                        onClick={handleConnectWallet}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        <WalletIcon className="w-4 h-4" />
                        Connect External Wallet
                    </button>
                )}
            </div>
        </div>
    )
}
