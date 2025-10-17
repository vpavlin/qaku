import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useWakuContext } from "../hooks/useWaku";
import { QakuContextProvider, useQakuContext } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import QA from "../components/qa";
import Status from "../components/status";
import { Wallet } from "lucide-react";

const AttendeeContent = () => {
    const { handleConnectWallet, walletConnected, externalAddr } = useQakuContext();
    const [connecting, setConnecting] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Minimal header with status */}
            <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="text-lg font-bold font-mono text-primary">QAKU</div>
                    <div className="flex items-center gap-3">
                        {walletConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                                <Wallet className="w-4 h-4 text-primary" />
                                <span className="text-sm font-mono text-primary">{externalAddr}</span>
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    setConnecting(true)
                                    const success = await handleConnectWallet()
                                    setConnecting(false)
                                    if (!success) {
                                        setShowWalletModal(true)
                                    }
                                }}
                                disabled={connecting}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wallet className="w-4 h-4" />
                                {connecting ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        )}
                        <Status />
                    </div>
                </div>
            </div>

            {/* Main content - focused on Q&A only */}
            <div className="container mx-auto px-4 py-6 max-w-5xl">
                <QA />
            </div>

            {/* Wallet Not Installed Modal */}
            {showWalletModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-destructive" />
                            </div>
                            <h3 className="text-xl font-bold">No Wallet Detected</h3>
                        </div>
                        
                        <p className="text-muted-foreground">
                            To connect your wallet, you need to install a browser wallet extension first.
                        </p>

                        <div className="space-y-3">
                            <p className="text-sm font-medium">Popular wallet options:</p>
                            <div className="space-y-2">
                                <a
                                    href="https://metamask.io/download/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <span className="font-medium">MetaMask</span>
                                    <span className="text-xs text-muted-foreground">Most popular</span>
                                </a>
                                <a
                                    href="https://www.coinbase.com/wallet"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <span className="font-medium">Coinbase Wallet</span>
                                    <span className="text-xs text-muted-foreground">User-friendly</span>
                                </a>
                                <a
                                    href="https://www.walletconnect.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <span className="font-medium">WalletConnect</span>
                                    <span className="text-xs text-muted-foreground">Mobile wallets</span>
                                </a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setShowWalletModal(false)}
                                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Attendee = () => {
    const { Element, toast } = useToastContext();
    const { connected, start } = useWakuContext();
    let { id } = useParams<"id">();
    let { password } = useParams<"password">();

    useEffect(() => {
        if (!start || connected) return;
        start();
    }, [start, connected]);

    return (
        <>
            <QakuContextProvider id={id} password={password} updateStatus={toast}>
                <AttendeeContent />
                <Element />
            </QakuContextProvider>
        </>
    );
};

export default Attendee;
