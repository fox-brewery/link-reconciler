import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import mimeTypes from 'mime-types'
import watcher from '@parcel/watcher'
import { globby } from 'globby'
import md5 from 'md5'
import { parseArgs } from 'node:util'
import { existsSync } from 'node:fs'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		help: {
			type: 'boolean',
			short: 'h'
		}
	}
})

if (values.help) {
	console.info(`program <rootDir>`)
	process.exit(1)
}

const root = path.resolve(positionals.length > 0 ? positionals[0] : process.cwd())
/** @typedef {{root: string, indexFile: string}} Ctx */
/** @type {Ctx} */
const ctx = {
	root,
	indexFile: path.join(root, '.cache', '.data.json')
}
console.info('ctx', ctx)

if (!existsSync(ctx.indexFile)) {
	await fs.writeFile(ctx.indexFile, '{ "references": [] }\n')
}
await watcher.subscribe(root,
	async (err, events) => {
		if (err) {
			console.error(err)
			return
		}

		for (const event of events) {
			console.log(event)

			await updateIndex(ctx, event)

			console.log()
		}
	}, {
	ignore: ['.git', 'node_modules', '.cache']
}
);

/**
 * @param {Ctx} ctx
 * @param {{ path: string, type: 'create' | 'update' | 'delete' }} event
 */
async function updateIndex(ctx, event) {
	const relPath = toRelativePath(ctx.root, event.path)
	const indexFileContent = await fs.readFile(ctx.indexFile, 'utf-8')
	/** @type {import('./index.d.ts').IndexFile} */
	const indexFileJson = JSON.parse(indexFileContent)
	const mimeType = mimeTypes.lookup(relPath)

	// Update hashes
	{
		if (event.type === 'create') {
			const content = await fs.readFile(event.path, 'utf-8')
			console.log(relPath, mimeType)
			if (mimeType === 'text/markdown') {
				const indexOfExistingEntry = indexFileJson.references.findIndex((ref) => {
					return ref.file === relPath
				})
				if (indexOfExistingEntry !== -1) {
					throw new Error(`Adding references for file ${relPath}, but it already exists in index file!`)
				}
				
				await addAllReferences(indexFileJson, relPath, content, event)
				await fs.writeFile(ctx.indexFile, JSON.stringify(indexFileJson, null, '\t'))
			}
		} else if (event.type === 'delete') {
			if (mimeType === 'text/markdown') {
				await removeAllReferences(indexFileJson, relPath)
				await fs.writeFile(ctx.indexFile, JSON.stringify(indexFileJson, null, '\t'))
			}
		} else if (event.type === 'update') {
			await removeAllReferences(indexFileJson, relPath)
			const content = await fs.readFile(event.path, 'utf-8')
			await addAllReferences(indexFileJson, relPath, content, event)
			await fs.writeFile(ctx.indexFile, JSON.stringify(indexFileJson, null, '\t'))
		}
	}
}

/**
 * @param {string} root
 * @param {string} filepath
 */
function toRelativePath(root, filepath) {
	if (path.isAbsolute(filepath)) {
		const rel = filepath.slice(root.length + 1)
		return './' + rel
	}
	
	if (filepath.startsWith('./')) {
		return filepath
	}

	return './' + filepath
}

/**
 * @param {import('./index.d.ts').IndexFile} json
 * @param {string} relPath
 */
async function removeAllReferences(json, relPath) {
	const indexFileJson = json

	for (let i = indexFileJson.references.length - 1; i >= 0; --i) {
		const ref = indexFileJson.references[i]
		if (ref.file === relPath) {
			indexFileJson.references.splice(i, 1)
		}
	}
	await fs.writeFile(ctx.indexFile, JSON.stringify(indexFileJson, null, '\t'))
}

/**
 * @param {import('./index.d.ts').IndexFile} json
 * @param {string} relPath
 */
async function addAllReferences(json, relPath, content, event) {
	const indexFileJson = json

	const parsedReferences = await parseMarkdownForReferences(event.path)
	for (const ref of parsedReferences) {
		indexFileJson.references.push({
			file: relPath,
			md5: md5(content),
			title: ref.name,
			uri: ref.link
		})
	}
}

/**
 * @param {string} filepath
 * @returns {Promise<Array<{name: string, link: string}>>}
 */
async function parseMarkdownForReferences(filepath) {
	const content = await fs.readFile(filepath, { encoding: 'utf-8' })
	const tree = await unified()
		.use(remarkParse)
		.parse(content)

	/** @type {Array<{name: string, link: string}>} */
	const links = []
	visit(tree, 'link', (node, index, parent) => {
		links.push({
			name: node?.children?.[0]?.value ?? 'UNKNOWN',
			link: node.url
		})
	 })

	return links
}


