<script lang="ts">
	import {
		GEAR_AUGMENT_LABELS,
		GEAR_LABELS,
		GearPart,
		getRollValue,
		VALID_GEAR_AUGMENT_STATS,
		VALID_GEAR_RANDOM_STATS,
		type ValidGearPart
	} from '$lib/scripts/gears';
	import { STAT_CONSTANTS } from '$lib/scripts/json-loader';
	import { user_gears } from '$lib/scripts/stores';
	import type { Elements, GearAugment, StatGearUser, UserGear } from '$lib/types';
	import { PlusIcon } from '@lucide/svelte';
	import Dialog from '../Dialog.svelte';
	import FlexGrid from '../FlexGrid.svelte';
	import StatIcon from '../StatIcon.svelte';

	type StatValues = { stat: StatGearUser | null; value: string };
	type StatArr = [StatValues, StatValues, StatValues, StatValues];
	type AssignableStat = StatGearUser | 'dmg_percent' | 'atk_percent' | 'res_percent' | null;

	const DEFAULT_STAT: StatArr = [
		{ stat: null, value: '' },
		{ stat: null, value: '' },
		{ stat: null, value: '' },
		{ stat: null, value: '' }
	];

	const GROUP_1 = ['Helmet', 'Spaulders', 'Armor', 'Bracers', 'Belt', 'Legguards'];
	const GROUP_2 = ['Gloves', 'Boots'];
	const GROUP_3 = ['Visor', 'Engine', 'Exoskeleton', 'Reactor'];

	const ELEMENTS: Elements[] = ['flame', 'frost', 'volt', 'phys', 'alt'];
	const STATS: AssignableStat[] = [
		'hp',
		'hp_percent',
		'atk',
		'atk_percent',
		'res',
		'res_percent',
		'crit',
		'crit_percent',
		'dmg_percent'
	];
	const LOW_STATS: StatGearUser[] = ['hp', 'res', 'phys_res', 'flame_res', 'frost_res', 'volt_res'];

	let { open = $bindable(false), addNewGear = (gear: UserGear, equip?: boolean) => {} } = $props();

	// Part Dialog
	let part_dialog_open = $state<boolean>(false);
	let part = $state<ValidGearPart | GearPart.UNKNOWN>(GearPart.UNKNOWN);

	// Gear Augment Dialog
	let augment_dialog_open = $state<boolean>(false);
	let augment = $state<GearAugment | null>(null);

	// Stat Dialog
	let stat_dialog_open = $state<boolean>(false);

	let edited_stat_ind = $state<number>(0);
	let edited_stat_element = $state<Elements | null>(null);
	let edited_stat_stat = $state<AssignableStat | null>(null);

	let stats = $state<StatArr>(DEFAULT_STAT);
	let total_roll_value = $derived(
		stats.reduce(
			(acc, stat) => acc + (stat.stat ? getRollValue(stat.stat, Number(stat.value)) : 0),
			0
		)
	);
	let manual_titan_override = $state(false);
	let user_is_titan = $state(false);
	let is_titan = $derived(manual_titan_override ? user_is_titan : total_roll_value > 5);

	let enabled_buttons = $derived.by(() => {
		if (part === GearPart.UNKNOWN) {
			return { button: [], primary: '' };
		} else if (stats.reduce((acc, stat) => acc + Number(stat.stat !== null), 0) < 4) {
			return { button: ['Fill'], primary: 'Fill' };
		} else {
			return { button: ['Add'], primary: 'Add' };
		}
	});

	function assignStat() {
		let assignedStat: StatGearUser;

		// stuff that require element
		if (
			edited_stat_stat === 'atk_percent' ||
			edited_stat_stat === 'dmg_percent' ||
			edited_stat_stat === 'res_percent'
		) {
			if (!edited_stat_element) {
				edited_stat_stat = null;
				return;
			}

			assignedStat = edited_stat_stat as StatGearUser;
		}

		// stuff that must not have element
		if (edited_stat_stat?.includes('crit') || edited_stat_stat?.includes('hp')) {
			assignedStat = edited_stat_stat as StatGearUser;
		} else {
			// stuff that can have element
			assignedStat = (
				edited_stat_element ? `${edited_stat_element}_${edited_stat_stat}` : edited_stat_stat
			) as StatGearUser;
		}

		// check if specific stat already exists
		if (stats.some((stat) => stat.stat === assignedStat)) {
			console.error('stat alr exist!');
		} else if (!VALID_GEAR_RANDOM_STATS[part as ValidGearPart].includes(assignedStat)) {
			console.error('invalid random stat for part!');
		} else {
			stats[edited_stat_ind] = {
				stat: assignedStat,
				value: STAT_CONSTANTS[assignedStat].base.toString()
			};
		}

		edited_stat_element = null;
		edited_stat_stat = null;
		stat_dialog_open = false;
	}

	function onButtonPress(btn: string | 'Add' | 'Fill' | 'Cancel') {
		switch (btn) {
			case 'Add': {
				const id = $user_gears.length;
				const dateAdded = new Date().toISOString();

				const newGear: UserGear = {
					id,
					part,
					dateAdded,
					augment: augment ? [augment, 3] : undefined
				};
				stats.forEach((stat) => {
					if (stat.stat !== null) {
						if (is_titan) {
							newGear[`titan_${stat.stat}`] = stat.value;
						} else {
							newGear[stat.stat] = stat.value;
						}
					}
				});

				addNewGear(newGear);

				open = false;
				cleanup();
				break;
			}
			case 'Fill': {
				const existing_stats = stats.filter((stat) => stat.stat !== null);
				let curr_n_stats = existing_stats.length;

				// @ts-expect-error
				LOW_STATS.filter((stat) => !existing_stats.includes(stat)).forEach((stat) => {
					if (curr_n_stats === 4) {
						return;
					}

					stats[curr_n_stats] = {
						stat,
						value: STAT_CONSTANTS[stat].base.toString()
					};
					curr_n_stats++;
				});

				break;
			}

			default: {
				cleanup();
				open = false;
				break;
			}
		}
	}

	function cleanup() {
		manual_titan_override = false;
		user_is_titan = false;
		part = GearPart.UNKNOWN;
		augment = null;
		stats = DEFAULT_STAT;
	}
</script>

<Dialog
	title="Add Gear"
	buttons={[...enabled_buttons.button, 'Cancel']}
	primary={enabled_buttons.primary}
	{onButtonPress}
	bind:open
>
	<div class="horizontal" style="align-items: flex-start; gap: 2rem;">
		<div class="vertical" style="gap: 1rem;">
			<h3>Gear Part</h3>
			<button
				class={part === GearPart.UNKNOWN ? 'border' : 'image'}
				id="specify-part"
				onclick={() => (part_dialog_open = true)}
				style="margin: auto 0;"
			>
				{#if part === GearPart.UNKNOWN}
					<PlusIcon />
					<label class="in-button" for="specify-part">Assign</label>
				{:else}
					<img
						src="./gear/{is_titan ? 'titan/' : ''}{part}.png"
						alt="Gear Part"
						style="width: 40px;"
					/>
				{/if}
			</button>

			{#if part !== GearPart.UNKNOWN}
				<button
					class="border"
					class:selected={is_titan}
					id="toggle-titan"
					onclick={() => {
						user_is_titan = !is_titan;
						manual_titan_override = true;
					}}
				>
					<label class="in-button" for="toggle-titan">Toggle Titan</label>
				</button>

				{#if is_titan}
					<button
						class="image"
						class:border={augment === null}
						id="augment-stat"
						onclick={() => (augment_dialog_open = true)}
					>
						{#if augment}
							<div class="vertical center">
								<img
									class="slot-icon"
									src="./augment_icon/{augment}.webp"
									alt={GEAR_AUGMENT_LABELS[augment]}
									width="30px"
								/>
								<label class="in-button" for="augment-stat">{GEAR_AUGMENT_LABELS[augment]}</label>
							</div>
						{:else}
							<PlusIcon />
							<label class="in-button" for="augment-stat">Augment</label>
						{/if}
					</button>
				{/if}
			{/if}
		</div>

		{#if part !== GearPart.UNKNOWN}
			<div class="vertical" style="gap: 1rem;">
				<h3>Gear Random Stats</h3>
				{#each stats as stat, indx}
					<div class="horizontal">
						<button
							class="image"
							class:border={stat.stat === null}
							onclick={() => {
								stat_dialog_open = true;
								edited_stat_ind = indx;
							}}
							style="margin: auto 0;"
						>
							{#if stat.stat === null}
								<PlusIcon />
								<label class="in-button" for="specify-part">Add Stat</label>
							{:else}
								<StatIcon stat={stat.stat} style="max-width: 40px;" />
							{/if}
						</button>
						{#if stat.stat !== null}
							<input
								class="numeric"
								inputmode="numeric"
								pattern="[\d\.]*"
								bind:value={stat.value}
								style="width: 7ch; height: 2rem; margin: auto 0;"
							/>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</Dialog>

<Dialog title="Specify Part" relative_index={1} bind:open={part_dialog_open}>
	<div class="slot-grid">
		{#each Object.entries(GEAR_LABELS) as [id, label], indx}
			<button
				class:selected={part === id}
				class:group1={GROUP_1.includes(label)}
				class:group2={GROUP_2.includes(label)}
				class:group3={GROUP_3.includes(label)}
				onclick={() => {
					part = id as ValidGearPart;
					part_dialog_open = false;
				}}
				title={label}
			>
				<div class="vertical center">
					<img
						src={`./gear_icon/${label.toLowerCase()}.png`}
						alt={`${label} icon`}
						class="slot-icon"
						width="30px"
						height="30px"
					/>
					<span class="slot-label">{label}</span>
				</div>
			</button>
		{/each}
	</div>
</Dialog>

<Dialog title="Specify Augment" relative_index={1} bind:open={augment_dialog_open}>
	<div class="slot-grid">
		{#each VALID_GEAR_AUGMENT_STATS[part as ValidGearPart] as aug}
			<button
				class:selected={augment === aug}
				title={aug}
				id={aug}
				onclick={() => {
					augment = aug as GearAugment;
					augment_dialog_open = false;
				}}
			>
				<div class="vertical center">
					<img
						src={`./augment_icon/${aug}.webp`}
						alt={`${GEAR_AUGMENT_LABELS[aug]}`}
						class="slot-icon"
						width="30px"
					/>
					<label class="in-button" for={aug}>{GEAR_AUGMENT_LABELS[aug]}</label>
				</div>
			</button>
		{/each}
	</div>
</Dialog>

<Dialog title="Specify Stat" relative_index={2} bind:open={stat_dialog_open}>
	<div class="horizontal center">
		<div
			class="vertical center-hori"
			style="border-right: 2px solid var(--border-color); padding-right: 1rem;"
		>
			<h4>Element</h4>
			<FlexGrid min_cols={1} max_cols={1}>
				{#each ELEMENTS as element}
					<button
						class:selected={edited_stat_element === element}
						onclick={() => {
							if (edited_stat_element === element) {
								edited_stat_element = null;
							} else {
								edited_stat_element = element;
							}
						}}
						style="max-width: 70px;"
					>
						<StatIcon stat={element as StatGearUser} />
					</button>
				{/each}
			</FlexGrid>
		</div>
		<div class="vertical center-hori">
			<h4>Stat</h4>
			<FlexGrid min_cols={2} max_cols={2} by_column={false}>
				{#each STATS as stat}
					<button
						class:selected={edited_stat_stat === stat}
						onclick={() => {
							edited_stat_stat = stat;
							assignStat();
						}}
						style="max-width: 70px;"
					>
						<StatIcon stat={stat as StatGearUser} />
					</button>
				{/each}
			</FlexGrid>
		</div>
	</div>
</Dialog>

<style>
	.slot-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.slot-grid button {
		padding: 0.5rem;
		height: auto;
	}

	.slot-grid button.group1 {
		border-left: 3px solid #ff7700;
	}

	.slot-grid button.group2 {
		border-left: 3px solid #00aaff;
	}

	.slot-grid button.group3 {
		border-left: 3px solid #44cc44;
	}

	.slot-grid button.selected.group1 {
		border: 1px solid var(--border-color);
		border-left: 3px solid #ff7700;
	}

	.slot-grid button.selected.group2 {
		border: 1px solid var(--border-color);
		border-left: 3px solid #00aaff;
	}

	.slot-grid button.selected.group3 {
		border: 1px solid var(--border-color);
		border-left: 3px solid #44cc44;
	}

	button.selected {
		background-color: violet;
		color: var(--button-primary-text);
		border-color: var(--button-primary-border);
	}
</style>
