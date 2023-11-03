import { useMemo, useState } from "react";
import { generatePrivateKey, getPublicKey, symmetric } from "@waku/message-encryption";
import { Wallet } from "ethers";
import { utils } from "@noble/secp256k1"


const useIdentity = (name?: string, password: string = "password") => {
    const [wallet, setWallet] = useState<Wallet>()
    const [percent, setPercent] = useState<number>(0)
    const [publicKey, setPublicKey] = useState<Uint8Array>()
    const [privateKey, setPrivateKey] = useState<Uint8Array>()


    if (!name) name = "identity"

    const storageKey = `${name}-key`
    const progress = (percent: number) => {
        setPercent(Math.floor(percent * 100) )
    } 

    useMemo(async () => {
        let item = localStorage.getItem(storageKey)
        if (!item) {
            const newKey = generatePrivateKey()
            
            const w = new Wallet(utils.bytesToHex(newKey))
            item = await w.encryptSync(password)
            localStorage.setItem(storageKey, item)

        }

        const w = await Wallet.fromEncryptedJson(item, password, progress) as Wallet
        setWallet(w)
        setPublicKey(getPublicKey(w.privateKey.slice(2)))
        setPrivateKey(utils.hexToBytes(w.privateKey.slice(2)))
    }, [name])
    

    const result = useMemo(() => ({
        wallet,
        publicKey: publicKey,
        privateKey: privateKey,
        percent
    }), [
        wallet,
        percent])

    return result
}

export default useIdentity;