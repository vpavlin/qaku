import React, { useContext, useEffect, useMemo, useState } from "react";
import {sha256} from "js-sha256"

export type ToastInfo = {
    Element: () => JSX.Element
    error: (msg: string) => void
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
            {Array.from(toasts.values()).map((v: string) => 
                    <div className="alert alert-error">
                        <span>{v}</span>
                    </div>
            )}
        </div>
    )
}

export const ToastContextProvider = ({ children }: Props) => {
    const [toasts, setToasts] = useState<Map<string, string>>(new Map<string, string>())

    //const Element = <Element toasts={toasts} />

    let Element = () => ToastElement({toasts})

    useEffect(() =>{
        console.log("should redraw")
        Element = () => ToastElement({toasts})

    }, [toasts])

    const error = (msg: string) => {
        setToasts((t) => {
            const id = sha256(msg + new Date())

            t.set(id, msg)
            console.log(t)
            setTimeout(() => {
                setToasts((t) => {
                    t.delete(id)
                    return new Map<string, string>(t)
                })
            }, 10000)
            return new Map<string, string>(t)
        })
    }
    const toastInfo = useMemo(
        () => ({
            error,
            Element
        }),
        [
            error,
            Element
        ]
    )

    return ( <ToastContext.Provider value={{ providerInfo: toastInfo }}>
        { children }
    </ToastContext.Provider>)
}

interface IProps {
    toasts: Map<string, string>
}

