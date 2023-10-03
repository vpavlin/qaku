// from https://gist.github.com/grrowl/ca94e47a6da2062e9bd6dad211588597

import elliptic, { eddsa as EdDSA } from 'elliptic'
import { ethers } from 'ethers';


export const verifyMessage = (message:string, signature:string, publicKey: string) => {
    try {
      const signer = ethers.verifyMessage(message, signature)
      return signer == publicKey
    } catch {
      return false
    }

}

export const toHex = (arr:any):string => {
    return elliptic.utils.toHex(arr)
}
  
export const fromHex =(hex:string) => {
    return elliptic.utils.toArray(hex, 'hex')
}
