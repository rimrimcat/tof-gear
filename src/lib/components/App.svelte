<script lang="ts">
	import { createAllGearViewsFromLoadout } from '$lib/scripts/gears';
	import { loadStatConstants } from '$lib/scripts/json-loader';
	import { loadObject, openImageDB } from '$lib/scripts/loader';
	import {
		applyExtraGearViewStats,
		createStatViewFromStore,
		getAllEffectsFromStore,
		getAllStatsFromStore,
		getEquippedGearViews,
		updateWeaponMatrixRelicTraitFromStore
	} from '$lib/scripts/loadout';
	import {
		all_effects,
		all_stats,
		current_loadout,
		equipped_gear_views,
		font_size,
		guide_content,
		guide_open,
		guide_title,
		inner_width,
		is_mobile,
		loadout_element,
		scroll_y,
		stat_autoupdate,
		stat_view,
		toolbar_transform,
		user_gears,
		user_loadouts
	} from '$lib/scripts/stores';
	import { AppWindowIcon } from '@lucide/svelte';
	import { onMount, type Component } from 'svelte';
	import FloatingWindow from './FloatingWindow.svelte';
	import ReadySignal from './ReadySignal.svelte';
	import Toolbar from './Toolbar.svelte';

	let { signal = $bindable(false) } = $props();

	type NavIds = 'main-page' | 'loadout-page' | 'gear-page' | 'stat-page';
	type NavItem = {
		id: NavIds;
		label: string;
		lucide: Component;
		import_name: string;
	};

	// Toolbar
	let is_collapsed = $state(true);

	// Active Nav
	let active_component = $state({
		id: 'main-page',
		label: 'Main Page',
		lucide: AppWindowIcon,
		import_name: 'MainPage'
	} as NavItem);

	// Dialogs

	// color scheme
	let styles = $state({});

	onMount(async () => {
		// get font size and check if mobile
		$font_size = parseFloat(getComputedStyle(document.documentElement).fontSize);
		$is_mobile = (13.75 * $font_size) / $inner_width > 0.25;

		// setup imagedb
		openImageDB();

		// load styles
		const _styles = loadObject('styles');
		const root = document.documentElement;
		Object.entries(_styles).forEach(([key, value]) => {
			root.style.setProperty(`--${key}`, value);
		});
		root.style.overscrollBehavior = 'contain';
		styles = _styles;

		// load synced
		$user_gears = loadObject('gears_v1');
		$user_loadouts = loadObject('loadouts_v1');
		$current_loadout = Object.keys($user_loadouts)[0];

		// processing
		await loadStatConstants(); // need this for gear proecssing
		// create initial gear views

		await createAllGearViewsFromLoadout();
		console.log('Gear Views processed');

		// create initial weapon and matrix views
		await updateWeaponMatrixRelicTraitFromStore();
		$stat_autoupdate = true;
	});

	// auto update for stats and gear views
	$effect(() => {
		if (!$stat_autoupdate) return;
		console.log('Stat Autoupdate');

		const selected_loadout = $user_loadouts[$current_loadout];
		$equipped_gear_views = getEquippedGearViews(selected_loadout.equipped_gears);
		$loadout_element = selected_loadout.element;
		$all_effects = getAllEffectsFromStore();
		$all_stats = getAllStatsFromStore();
		$stat_view = createStatViewFromStore();
		applyExtraGearViewStats();
	});
</script>

<svelte:window bind:innerWidth={$inner_width} />
<div class="vertical center-hori app-bg">
	<div class="app-container">
		<Toolbar bind:active_component bind:is_collapsed />

		<div
			class="vertical content-container"
			class:mobile={is_mobile}
			style="translate: 0 {$toolbar_transform}px; padding-bottom: {$toolbar_transform +
				$font_size * 3}px;"
			onscroll={(e: UIEvent) => {
				$scroll_y = (e.target as HTMLElement).scrollTop;
			}}
		>
			{#await import(`./nav/${active_component.import_name}.svelte`) then { default: Nav }}
				<Nav />
			{/await}
		</div>
	</div>
</div>

<FloatingWindow
	title={$guide_title}
	open={$guide_open}
	guide_content={$guide_content}
	autoResize={true}
	onClose={() => ($guide_open = false)}
>
	<p>This is a floating window without content.</p>
</FloatingWindow>

<ReadySignal bind:signal />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		/* background-color: var(--bg-color); */
		color: var(--text-color);
		overscroll-behavior: contain;
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

	:global(input) {
		background-color: var(--button-bg);
		border: 1px solid var(--button-border);
		border-radius: 0.5rem;
		color: var(--button-text);
		padding: 2px 6px;
		font-size: large;
	}

	:global(.horizontal) {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	:global(.horizontal.center) {
		justify-content: center;
	}

	:global(div.horizontal.center-hori) {
		align-items: center;
	}

	:global(div.horizontal.center-vert) {
		justify-content: center;
	}

	:global(div.hori-item) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(div.vertical) {
		display: flex;
		flex-direction: column;
	}

	:global(div.vertical.center) {
		align-items: center;
		justify-content: center;
	}

	:global(div.vertical.center-hori) {
		align-items: center;
	}

	:global(div.vertical.center-vert) {
		justify-content: center;
	}

	:global(div.vertical-left) {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		align-items: flex-start;
	}

	:global(div.item-flex) {
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
		/* display: flex; */
		cursor: pointer;
		text-align: center;
		vertical-align: middle;
		pointer-events: none;
	}

	:global(*:focus-visible) {
		outline: 2px solid var(--focus-outline);
		outline-offset: 2px;
	}

	:global(img.border) {
		border-radius: 1rem;
		background-color: rgb(99 99 99);
		width: 8rem;
		height: 8rem;
	}

	:global(img.user-upload) {
		max-width: 80vw;
		max-height: 60vh;
		border-radius: 1rem;
	}

	.app-bg {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background-color: var(--bg-color);
		color: var(--text-color);
		overscroll-behavior-x: none;
	}

	.app-container {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background-color: var(--bg-color);
		color: var(--text-color);
		overscroll-behavior-x: none;
	}

	@media (max-width: 991px) {
		.app-container {
			min-width: 100%;
			width: 100%;
		}
	}

	@media (min-width: 992px) {
		.app-container {
			min-width: 900px;
			width: 900px;
		}
	}

	.content-container {
		flex: 1;
		display: flex;
		overflow-y: scroll;
		overflow-x: hidden;
		padding-left: 1rem;
		padding-right: 6rem;
		transition:
			translate 0.3s cubic-bezier(0.16, 1, 0.3, 1),
			padding-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		max-width: 900px;
	}

	.content-container.mobile {
		margin-top: 3rem;
	}

	:global(input[type='number'].numeric) {
		appearance: textfield;
		-moz-appearance: textfield;
		-webkit-appearance: none;
	}
	:global(input.numeric::-webkit-outer-spin-button),
	:global(input.numeric::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}

	/* for composing icons */

	:global(.compose.below) {
		position: relative;
	}

	:global(.compose.above) {
		position: absolute;
		top: 0;
		left: 0;
	}

	:global(.compose.lucide) {
		height: 24px;
		width: 24px;
	}

	:global(.compose.border) {
		border-radius: 1rem;
		background-color: rgb(99 99 99);
	}

	/* for use with interactive guide */
	:global(.glowing) {
		animation: glowPulse 2s ease-in-out infinite;
		box-shadow:
			0 0 10px rgba(255, 127, 17, 0.4),
			0 0 20px rgba(255, 127, 17, 0.5),
			0 0 30px rgba(255, 127, 17, 0.6);
		position: relative;
		z-index: 1;
	}

	@keyframes glowPulse {
		0%,
		100% {
			box-shadow:
				0 0 5px rgba(255, 127, 17, 0.3),
				0 0 10px rgba(255, 127, 17, 0.4),
				0 0 15px rgba(255, 127, 17, 0.5);
		}
		50% {
			box-shadow:
				0 0 15px rgba(255, 127, 17, 0.5),
				0 0 25px rgba(255, 127, 17, 0.6),
				0 0 35px rgba(255, 127, 17, 0.7);
		}
	}
</style>
