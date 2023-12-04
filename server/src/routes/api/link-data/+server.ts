import * as fs from 'node:fs/promises'

/** @type {import('./$types').PageServerLoad} */
export async function POST() {
	const file = '/home/edwin/repositories/fox-brewery/link-reconciler/testing/.cache/data.json'

    const content = await fs.readFile(file, 'utf-8')
    return new Response(content)
}
