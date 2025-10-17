import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWakuContext } from "../hooks/useWaku";
import { QakuContextProvider } from "../hooks/useQaku";
import { useToastContext } from "../hooks/useToast";
import QA from "../components/qa";
import Status from "../components/status";

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
                <div className="min-h-screen bg-background">
                    {/* Minimal header with status */}
                    <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
                        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                            <div className="text-lg font-bold font-mono text-primary">QAKU</div>
                            <Status />
                        </div>
                    </div>

                    {/* Main content - focused on Q&A only */}
                    <div className="container mx-auto px-4 py-6 max-w-5xl">
                        <QA />
                    </div>
                </div>
                <Element />
            </QakuContextProvider>
        </>
    );
};

export default Attendee;
