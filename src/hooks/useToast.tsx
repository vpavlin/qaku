import React, { useContext, useEffect, useMemo, useState } from "react";
import {sha256} from "js-sha256"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastInfo = {
    Element: () => JSX.Element
    error: (msg: string) => void
    info: (msg: string) => void
    toast: (msg: string, typ: string) => void
}

export type ToastContextData = {
    providerInfo: ToastInfo;
} | null;

export const ToastContext = React.createContext<ToastContextData>(null);

export const useToastContext = () => {
    const toastContext = useContext(ToastContext);

    if (!toastContext) {
        throw new Error("ToastContext at a wrong level")
    }
    const { providerInfo } = toastContext;
    return useMemo<ToastInfo>(() => {
        return {...providerInfo}
    }, [toastContext])
}


interface Props {
    children: React.ReactNode
}

const getToastIcon = (type: string) => {
    switch(type) {
        case 'error':
            return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
        case 'success':
            return <CheckCircle2 className="w-5 h-5 flex-shrink-0" />;
        case 'info':
        default:
            return <Info className="w-5 h-5 flex-shrink-0" />;
    }
}

const getToastStyles = (type: string) => {
    switch(type) {
        case 'error':
            return 'bg-destructive/10 border-destructive text-destructive';
        case 'success':
            return 'bg-accent/10 border-accent text-accent';
        case 'info':
        default:
            return 'bg-primary/10 border-primary text-primary';
    }
}

export const ToastElement = ({toasts, removeToast}: IProps) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md">
            {Array.from(toasts.entries()).map((v: [string, Toast]) => 
                <div 
                    key={v[0]} 
                    id={v[0]} 
                    className={`
                        flex items-start gap-3 px-4 py-3 rounded-lg border-2
                        backdrop-blur-sm shadow-lg
                        animate-in slide-in-from-right duration-300
                        ${getToastStyles(v[1].typ)}
                    `}
                >
                    {getToastIcon(v[1].typ)}
                    <span className="flex-1 text-sm font-medium text-foreground">
                        {v[1].msg}
                    </span>
                    <button
                        onClick={() => removeToast(v[0])}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}

export const ToastContextProvider = ({ children }: Props) => {
    const [toasts, setToasts] = useState<Map<string, Toast>>(new Map<string, Toast>())

    const removeToast = (id: string) => {
        setToasts((t) => {
            t.delete(id)
            return new Map<string, Toast>(t)
        })
    }

    let Element = () => ToastElement({toasts, removeToast})

    useEffect(() =>{
        Element = () => ToastElement({toasts, removeToast})
    }, [toasts])

    const error = (msg: string) => {
        toast(msg, "error", 10000)
    }

    const info = (msg: string) => {
        toast(msg, "info", 3000)
    }

    const toast = (msg: string, typ: string, delay?: number) => {
        setToasts((t) => {
            const id = sha256(msg + typ + new Date())

            t.set(id, {msg: msg, typ: typ})
            console.log(t)
            setTimeout(() => {
                setToasts((t) => {
                    t.delete(id)
                    return new Map<string, Toast>(t)
                })
            }, delay ? delay : 10000)
            return new Map<string, Toast>(t)
        })   
    }
    const toastInfo = useMemo(
        () => ({
            info,
            error,
            toast,
            Element
        }),
        [
            info,
            error,
            toast,
            Element
        ]
    )

    return ( <ToastContext.Provider value={{ providerInfo: toastInfo }}>
        { children }
    </ToastContext.Provider>)
}

type Toast = {
    msg: string
    typ: string
}

interface IProps {
    toasts: Map<string, Toast>
    removeToast: (id: string) => void
}

