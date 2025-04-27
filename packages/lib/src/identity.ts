import { generatePrivateKey } from "@waku/message-encryption";
import { Wallet } from "ethers";
import { utils } from "@noble/secp256k1"


export class Identity {

    name:string = "identity"
    password:string | undefined = undefined

    wallet:Wallet | undefined = undefined
    constructor(password:string, name?:string) {
        if (name) {
            this.name = name
        }

        this.password = password
    }

    public address():string {
        if (!this.wallet) throw new Error("Identity not initialized")
        return this.wallet!.address
    }

    public sign(message: string | Uint8Array):string {
        if (!this.wallet) throw new Error("Identity not initialized")

        return this.wallet.signMessageSync(message)
    }

    public getWallet():Wallet {
        if (!this.wallet) throw new Error("Identity not initialized")

        return this.wallet
    }

    public async init() {
 
        let item = localStorage.getItem(this.getStorageKey())
        if (!item) {
            const newKey = generatePrivateKey()
            
            item = await this.storePrivateKey(utils.bytesToHex(newKey))
        }

        this.wallet = await Wallet.fromEncryptedJson(item, this.password!) as Wallet
    }

    private async storePrivateKey(key:string) {
        const w = new Wallet(key)
        const item = await w.encryptSync(this.password!)
        localStorage.setItem(this.getStorageKey(), item)

        return item
    }

    private getStorageKey():string {
        return `${this.name}-key`
    }

}