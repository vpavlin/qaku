import React, { useContext, useEffect, useMemo, useState } from "react";
import {sha256} from "js-sha256"

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

export const ToastElement = ({toasts}: IProps) => {
    return (
        <div className="toast">
            {Array.from(toasts.entries()).map((v: [string, Toast], index) => 
                    <div key={index} id={v[0]} className={`alert alert-${v[1].typ}`}>
                        <span>{v[1].msg}</span>
                    </div>
            )}
        </div>
    )
}

export const ToastContextProvider = ({ children }: Props) => {
    const [toasts, setToasts] = useState<Map<string, Toast>>(new Map<string, Toast>())

    //const Element = <Element toasts={toasts} />

    let Element = () => ToastElement({toasts})

    useEffect(() =>{
        Element = () => ToastElement({toasts})

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
}

