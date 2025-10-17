import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWakuContext } from "../hooks/useWaku";
import { QakuContextProvider, useQakuContext } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import QA from "../components/qa";
import Status from "../components/status";
import { Wallet } from "lucide-react";

const AttendeeContent = () => {
    const { handleConnectWallet, walletConnected, externalAddr } = useQakuContext();

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
                                onClick={handleConnectWallet}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                            >
                                <Wallet className="w-4 h-4" />
                                Connect Wallet
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
