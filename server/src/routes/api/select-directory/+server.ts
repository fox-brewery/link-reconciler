import { json } from '@sveltejs/kit';
import { execa } from 'execa';

/** @type {import('./$types').PageServerLoad} */
export async function POST() {
	try {
		const result = await execa('zenity', [
			'--file-selection',
			'--title="Choose a directory"',
			'--directory'
		]);
		return json({
			directory: result.stdout
		});
	} catch (err) {
		return json({
			error: err
		});
	}
}
