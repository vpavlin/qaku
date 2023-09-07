// from https://gist.github.com/grrowl/ca94e47a6da2062e9bd6dad211588597

import elliptic, { eddsa as EdDSA } from 'elliptic'
import {Buffer} from 'buffer';


export const generateKey = () => {
    const ec = new EdDSA('ed25519');
    let secret;

    if (window.crypto && window.crypto.getRandomValues) {
      secret = new Uint8Array(256)
      window.crypto.getRandomValues(secret)

    } else {
      console.warn('Warning: Using insecure methods to generate private key')
      secret = []
      for (let i = 0; i < 256; i++) {
        secret.push(Math.random() * 9007199254740991) // aka Number.MAX_SAFE_INTEGER
      }
    }

    const key = ec.keyFromSecret(Buffer.from(secret))

    // Create key pair from secret
    return key
}

export const loadKey = (secret: EdDSA.Bytes) => {
    const ec = new EdDSA('ed25519');
    const res = ec.keyFromSecret(secret)

    return res
}


const codifyMessage = (message: string) => {
    return Buffer.from(message.split('').map(m => m.charCodeAt(0)))
}
  // signs a message with your own key
export const signMessage = (key: EdDSA.KeyPair, message: string) => {
// return signature
    if (key) {
        // ~1ms on my machine
        return key.sign(codifyMessage(message)).toHex()
    }

    return null
}

export const verifyMessage = (message:string, signature:string, publicKey: Buffer) => {
    const ec = new EdDSA('ed25519');
    // Import public key
    const key = ec.keyFromPublic(publicKey,)
    // Verify signature
    // 7~10ms on my machine
    return key.verify(codifyMessage(message), fromHex(signature))
}

export const toHex = (arr:any):string => {
    return elliptic.utils.toHex(arr).toUpperCase()
}
  
export const fromHex =(hex:string) => {
    return elliptic.utils.toArray(hex, 'hex')
}