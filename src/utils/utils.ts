export async function sleep(msec: number) {
	return await new Promise((r) => setTimeout(r, msec))
}