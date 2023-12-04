<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	let currentWorkspace = '';
	let workspaces: string[] = [];
	onMount(() => {
		workspaces = JSON.parse(localStorage.getItem('workspaceData') ?? '[]');
	});
	function removeWorkspace(workspace: string) {
		const workspacesString = localStorage.getItem('workspaceData');
		if (!workspacesString) return;
		const workspacesResult: string[] = JSON.parse(workspacesString);

		const place = workspacesResult.findIndex((item) => item === workspace);
		if (place !== -1) {
			workspacesResult.splice(place, 1);
			workspaces = workspacesResult;
		}
		localStorage.setItem('workspaceData', JSON.stringify(workspaces));
	}
	async function setCurrentWorkspace(workspace: string) {
		localStorage.setItem('currentWorkspace', workspace);
	}
	async function addWorkspace() {
		const result = await fetch('/api/select-directory', {
			method: 'POST'
		});
		console.log(result);
		type Json = { directory: string };
		let json: Json = await result.json();

		workspaces.push(json.directory);
		workspaces = workspaces;
		localStorage.setItem('workspaceData', JSON.stringify(workspaces));
		if (localStorage.getItem('currentWorkspace') === null) {
			localStorage.setItem('currentWorkspace', workspaces[0]);
		}
	}
</script>

<Header />
<h3>Current Workspace</h3>
{currentWorkspace}
<button on:click={addWorkspace}>New workspace</button>
<h3>Workspaces</h3>
<table class="pure-table pure-table-horizontal pure-table-striped">
	<thead>
		<th>Name</th>
		<th>Use</th>
		<th>Delete</th>
	</thead>
	<tbody>
		{#each workspaces as workspace}
			<tr>
				<td><span>{workspace}</span></td>
				<td><button on:click={() => setCurrentWorkspace(workspace)}>Set</button></td>
				<td><button on:click={() => removeWorkspace(workspace)}>Delete</button></td>
			</tr>
		{/each}
	</tbody>
</table>
