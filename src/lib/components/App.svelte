<script lang="ts">
	import type { UserGear } from '$lib/scripts/gears';
	import { loadObject, openImageDB } from '$lib/scripts/loader';
	import type { AllLoadouts } from '$lib/scripts/loadouts';
	import type { AttributeItem } from '$lib/scripts/stats';
	import { onMount, type Component } from 'svelte';
	import Dialog from './Dialog.svelte';
	import GearPage from './nav/GearPage.svelte';
	import LoadoutPage from './nav/LoadoutPage.svelte';
	import MainPage from './nav/MainPage.svelte';
	import OpenCvTest from './nav/OpenCvTest.svelte';
	import StatPage from './nav/StatPage.svelte';
	import Toolbar from './Toolbar.svelte';

	// Toolbar
	let isCollapsed = $state(true);
	let mobileToolbarTransform = $state(0);

	// Detect if mobile
	let fontSize = $state(0);
	let innerWidth = $state(1000);
	let isMobile = $derived((13.75 * fontSize) / innerWidth > 0.25);

	// Active Nav
	const navMap: Record<string, Component> = {
		'main-page': MainPage,
		'loadout-page': LoadoutPage,
		'stat-page': StatPage,
		'gear-page': GearPage,
		'opencv-test': OpenCvTest
	};
	let activeComponent = $state('main-page');
	let CurrentComponent: Component = $derived(navMap[activeComponent] || StatPage);

	// Dialogs
	let dialogOpen = $state(true);

	// color scheme
	let styles = $state({});

	// synced data across app
	let user_gears: UserGear[] = $state([]);
	let user_attributes: AttributeItem[] = $state([]);
	let user_loadouts: AllLoadouts = $state({});
	let current_loadout: string = $state('');

	onMount(() => {
		// run once

		// get font size
		fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

		// setup imagedb
		openImageDB();

		// load styles
		const _styles = loadObject('styles');
		const root = document.documentElement;
		Object.entries(_styles).forEach(([key, value]) => {
			root.style.setProperty(`--${key}`, value);
		});
		styles = _styles;

		// load synced
		user_gears = loadObject('gears_v1');
		user_attributes = loadObject('stats_main');
		user_loadouts = loadObject('loadouts_v1');
		current_loadout = Object.keys(user_loadouts)[0];
	});

	// $inspect('mobile detection:', isMobile);
	// $inspect('innerWidth', innerWidth);
</script>

<svelte:window bind:innerWidth />

<Dialog
	bind:open={dialogOpen}
	title="Note"
	blocking={true}
	blur={true}
	closable={true}
	buttons={['OK', 'Cancel']}
>
	<h3>This WebApp is under development</h3>
	<p>Will be missing some features.</p>
</Dialog>

<div class="app-container">
	<Toolbar bind:isMobile bind:activeComponent bind:isCollapsed bind:mobileToolbarTransform />

	<div
		class="content-container"
		class:mobile={isMobile}
		style="translate: 0 {isMobile ? mobileToolbarTransform : 0}px;"
	>
		<div style="display: none">
			<MainPage />
			<LoadoutPage />
			<StatPage />
			<GearPage />
			<OpenCvTest />
		</div>

		<CurrentComponent
			bind:isMobile
			bind:user_gears
			bind:user_attributes
			bind:user_loadouts
			bind:current_loadout
		/>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		/* background-color: var(--bg-color); */
		color: var(--text-color);
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		color: var(--title-color);
	}

	:global(button) {
		background-color: var(--button-bg);
		color: var(--button-text);
		border: 1px solid var(--button-border);
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	:global(button.collapse-toggle) {
		padding: 0 0;
	}

	:global(button:hover) {
		background-color: var(--button-hover-bg);
	}

	:global(button.primary) {
		background-color: var(--button-primary-bg);
		color: var(--button-primary-text);
		border: 1px solid var(--button-primary-border);
	}

	:global(button.primary:hover) {
		background-color: var(--button-primary-hover-bg);
	}

	/* for buttons that contain icons and responsive */
	:global(button.icon) {
		background-color: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.3s ease;
	}

	:global(button.icon:hover) {
		opacity: 1;
	}

	/* for buttons that contain image */
	:global(button.image) {
		background-color: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		opacity: 1;
	}

	/* buttons with border since they have label text */
	:global(button.border) {
		display: flex;
		background: none;
		border: 2px solid var(--border-color);
		border-radius: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		height: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	/* :global(div.column) {
		display: grid;
		flex-direction: column;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1rem;
	} */

	:global(div.horizontal) {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	:global(div.hori-item) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(div.equispace) {
		justify-content: space-around;
	}

	:global(div.full) {
		width: 100%;
		height: 100%;
	}

	:global(div.full-width) {
		width: 100%;
	}

	:global(div.full-height) {
		height: 100%;
	}

	:global(div.block) {
		display: block;
		padding: 1rem;
		width: 100%;
	}

	:global(div.noslider) {
		overflow-x: hidden;
		overflow-y: hidden;
	}

	:global(div.noslider-x) {
		overflow-x: hidden;
	}

	/* add opacity transition when hovering */
	:global(button.hover) {
		opacity: 0.7;
		transition: opacity 0.3s ease;
	}

	:global(button.hover:hover) {
		opacity: 1;
	}

	/* labels inside button */
	:global(label.in-button) {
		cursor: pointer;
	}

	:global(*:focus-visible) {
		outline: 2px solid var(--focus-outline);
		outline-offset: 2px;
	}

	:global(img.user-upload) {
		max-width: 80vw;
		max-height: 60vh;
		border-radius: 1rem;
	}

	.app-container {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background-color: var(--bg-color);
		color: var(--text-color);
		overscroll-behavior-x: none;
	}

	.content-container {
		flex: 1;
		display: flex;
		overflow-y: scroll;
		overflow-x: hidden;
		padding-left: 1rem;
		padding-right: 6rem;
		transition: translate 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.content-container.mobile {
		margin-top: 3rem;
	}
</style>
