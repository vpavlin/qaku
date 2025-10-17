declare module 'elliptic' {
  export class eddsa {
    constructor(curve: string);
    keyFromSecret(secret: string): any;
    keyFromPublic(pub: string): any;
    sign(message: any, key: any): any;
    verify(message: any, signature: any, key: any): boolean;
  }
  
  export const ec: any;
  
  export const utils: {
    toHex(arr: any): string;
    toArray(hex: string, encoding: string): any;
  };
  
  const elliptic: {
    eddsa: typeof eddsa;
    ec: any;
    utils: typeof utils;
  };
  
  export default elliptic;
}
