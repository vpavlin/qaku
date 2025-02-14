type SafeValue<x> = {
    error: boolean
    data: string | x
}

export class QakuCache {
    url: string
    constructor(url:string) {
        this.url = url
    }

    networkDownloadStream = async (cid: string): Promise<SafeValue<Response>> => {
        const resp = await fetch(`${this.url}/api/qaku/v1/snapshot/${cid}`, {mode: "cors"})
        console.log(resp)

        if (resp.status != 200) {
            return {error: true, data: resp.statusText}
        }

        return {error: false, data: resp}
    }

    info = async () => {
        const resp = await fetch(`${this.url}/api/qaku/v1/info`)
        console.log(resp)

        if (resp.status != 200) {
            return {error: true, data: resp.statusText}
        }

        return {error: false, data: resp}
    }
}