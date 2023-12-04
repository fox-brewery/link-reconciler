<script lang="ts">
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import type { IndexFile } from '@app/util/index.d.ts';

	let data: IndexFile = { references: [] };
	onMount(async () => {
		const response = await fetch('/api/link-data', { method: 'POST' });
		const json = await response.json();
		data = json;
		const uniqueFiles = Array.from(new Set(data.references.map((item) => item.file)));
		let elements = [];
		for (const uniqueFile of uniqueFiles) {
			elements.push({
				data: { id: uniqueFile }
			});
		}

		elements = elements.concat([
			{
				// node a
				data: { id: 'a' }
			},
			{
				// node b
				data: { id: 'b' }
			},
			{
				// edge ab
				data: { id: 'ab', source: 'a', target: 'b' }
			}
		]);
		const cy = cytoscape({
			container: document.getElementById('app'),
			elements,
			style: [
				{
					selector: 'node',
					style: {
						label: 'data(id)'
					}
				}
			]
		});
	});
	let greeting = 'press the button to load data';
	let loading = false;

	const loadData = async () => {
		loading = true;
		greeting = await trpc($page).greeting.query();
		loading = false;
	};
</script>

<Header />
<div></div>

<a
	href="#load"
	role="button"
	class="secondary"
	aria-busy={loading}
	on:click|preventDefault={loadData}>Load</a
>
<p>{greeting}</p>

<div id="app"></div>

<style>
	#app {
		width: 900px;
		height: 700px;
		border: 1px solid mediumpurple;
	}
</style>
