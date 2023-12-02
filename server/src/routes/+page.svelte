<script lang="ts">
	import cytoscape from 'cytoscape';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';

	let greeting = 'press the button to load data';
	let loading = false;

	const loadData = async () => {
		loading = true;
		greeting = await trpc($page).greeting.query()
		loading = false;
	};

    /** @type {string[]} */
    $: workspaces = []
    onMount(() => {
        workspaces = JSON.parse(localStorage.getItem('workspaces') ?? '[]')

		const cy = cytoscape({
			container: document.getElementById('app'),
			elements: [
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
			]
		});

		
	});
    function deleteWorkspace(workspace: string) {
        const ws = localStorage.getItem('workspaces')
        if (!ws) return
        const workspaces: string[] = JSON.parse(ws)
        const place = workspaces.findIndex((item) => item === workspace)
        if (place !== -1) workspaces.splice(place, 1)
        localStorage.setItem('workspaces', JSON.stringify(workspaces))
    }
    async function newWorkspace() {
        const result = await fetch('/api/add', {
            method: 'POST'
        })
        console.log(result);
        let json = await result.json()
        console.log(json)
     
        workspaces.push(json.output)
        localStorage.setItem('workspaces', JSON.stringify(workspaces))

    }
    function chosenDirectory(value) {
        console.log(value)
    }
    function get
</script>

<div>
    <button on:click={newWorkspace}>New workspace</button>
    <!-- <input on:change={chosenDirectory} id="design" type="fileselector" webkitdirectory="true" directory/> -->

    <h1>Workspaces</h1>
    {#each workspaces as workspace}
    <section>
        <span>{workspace}</span>
        <button on:click={() => deleteWorkspace(workspace)}>Delete</button>
        <hr />
    </section>
    {/each}
</div>

<a
	href="#load"
	role="button"
	class="secondary"
	aria-busy={loading}
	on:click|preventDefault={loadData}>Load</a
>
<p>{greeting}</p>


<h2>Whole Map</h2>
<div id="app"></div>

<style>
	#app {
		width: 900px;
		height: 700px;
		border: 1px solid mediumpurple;
	}
</style>
