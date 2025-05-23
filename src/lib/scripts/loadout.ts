import { eval as evil, parse } from '@casbin/expression-eval';
import { get } from 'svelte/store';
import type {
	AllEffectTypes,
	BaseStats16,
	EquippedGear,
	FinalizedEffect,
	FinalizedMatrixEffect,
	FinalizedTraitEffect,
	GearEffect,
	GearView,
	GearViewStatShort,
	Loadout,
	MatrixView,
	OtherEffect,
	RelicEffect,
	RelicView,
	ResoEffect,
	ResoEffectsIds,
	ResoTriggerCounts,
	RotationView,
	SettingView,
	StatAtkImprovement,
	StatKey,
	TraitView,
	UnfinalEffectTypes,
	UserMatrix,
	UserRelic,
	UserTrait,
	UserWeapon,
	ValidGearPart,
	Weapon,
	WeaponBaseEffect,
	WeaponSetting,
	WeaponView
} from '../types/index';
import {
	getMatrix,
	getMatrixEffect,
	getRelic,
	getRelicEffect,
	getResoEffects,
	getTrait,
	getTraitEffect,
	getWeapon,
	getWeaponEffect,
	getWeaponSetting
} from './json-loader';
import {
	LumpedStatCollection,
	STAT_LABELS,
	StatCollection,
	TEMPLATE_USER_ATTRIBUTES
} from './stats';
import {
	all_stats,
	base_weapons,
	current_loadout,
	equipped_gear_views,
	gear_views,
	matrix_views,
	relic_views,
	reso_counts,
	reso_effects,
	rotation_view,
	trait_view,
	user_loadouts,
	weapon_views
} from './stores';
import { formatValue } from './validation';
import { WEAPON_BASE_STATS } from './weapons';

function finalizeEffect(
	eff: UnfinalEffectTypes,
	reso_counts_: ResoTriggerCounts,
	rotation_view_: RotationView,
	weapon_index?: number,
	advancement?: number,
	user_weapons_?: UserWeapon[],
	debug?: boolean
): FinalizedEffect | null {
	// factor to multiply stats by (onfield/hp)
	let effectiveness = 1;

	// check if required reso is fulfilled
	if (eff.require_reso) {
		const required_reso_count = eff.require_reso_count ?? 2;
		if ((reso_counts_[eff.require_reso] ?? 0) < required_reso_count) {
			if (debug) {
				console.log(
					'required reso not fulfilled:',
					eff.id,
					'Expected ',
					eff.require_reso,
					':',
					required_reso_count,
					'Got:',
					reso_counts_[eff.require_reso] ?? 0
				);
			}
			return null;
		}
	}

	// check if required adv is fulfilled
	if ('require_adv' in eff && eff.require_adv && (advancement ?? 0) < eff.require_adv) {
		if (debug) {
			console.log(
				'required adv not fulfilled:',
				eff.id,
				'Expected adv >=',
				eff.require_adv,
				'Got:',
				advancement ?? 0
			);
		}
		return null;
	}

	// check if required adv not gt is fulfilled
	if (
		'require_adv_not_gt' in eff &&
		eff.require_adv_not_gt &&
		(advancement ?? 0) >= eff.require_adv_not_gt
	) {
		if (debug) {
			console.log(
				'required adv not gt fulfilled:',
				eff.id,
				'. Expected adv not >=',
				eff.require_adv_not_gt,
				'Got:',
				advancement
			);
		}
		return null;
	}

	// check if required weapon is present
	if (
		eff.require_weapon &&
		!(user_weapons_ ?? []).some((weapon) => weapon.id === eff.require_weapon)
	) {
		if (debug) {
			console.log('required weapon for', eff.id, 'not present:', eff.require_weapon);
		}
		return null;
	}

	// TEMPORARILY DISABLE TEAMPLAY EFFECTS
	if (eff.require_teamplay) {
		if (debug) console.log('teamplay effect disabled:', eff.id);
		return null;
	}

	if (
		(eff.duration !== undefined && eff.duration === 0) ||
		('require_onfield' in eff && eff.require_onfield)
	) {
		if (!rotation_view_) {
			if (debug) console.log('onfield effect for', eff.id, 'missing rotation view');
			return null;
		}

		if (weapon_index === undefined && eff.require_onfield_weapon && user_weapons_) {
			weapon_index = user_weapons_.findIndex((weapon) => weapon.id === eff.require_onfield_weapon);

			if (weapon_index === -1) {
				if (debug)
					console.log('onfield effect for', eff.id, 'missing weapon:', eff.require_onfield_weapon);
				return null;
			}
		} else {
			// assume onfield is primary weapon
			weapon_index = rotation_view_.primary_weapon;
		}

		effectiveness *= rotation_view_.onfield_times[weapon_index] / rotation_view_.rotation_period;
	}

	if (eff.require_hp_less_than) {
		effectiveness *= eff.require_hp_less_than / 100;
	}

	if (eff.require_hp_greater_than) {
		effectiveness *= (100 - eff.require_hp_greater_than) / 100;
	}

	const vals_: (
		| number
		| string
		| [number, number, number, number]
		| [string, string, string, string]
	)[] = Object.values(eff.stats);

	const keys = Object.keys(eff.stats);
	const finalEffect = {
		...eff,
		stats: {},
		advancement
	};

	if (typeof vals_[0] === 'object') {
		// for matrix data
		keys.forEach((key) => {
			// @ts-expect-error: key is guaranteed to exist
			const expr_or_number: string | number = eff.stats[key][advancement];

			if (typeof expr_or_number === 'string') {
				// @ts-expect-error: key is guaranteed to exist
				finalEffect.stats[key] = evil(parse(expr_or_number), reso_counts_) * effectiveness;
			} else {
				// @ts-expect-error: key is guaranteed to exist
				finalEffect.stats[key] = expr_or_number * effectiveness;
			}
		});
	} else {
		keys.forEach((key) => {
			// @ts-expect-error: key is guaranteed to exist
			const expr_or_number: string | number = eff.stats[key];

			if (typeof expr_or_number === 'string') {
				// @ts-expect-error: key is guaranteed to exist
				finalEffect.stats[key] = evil(parse(expr_or_number), reso_counts_) * effectiveness;
			} else {
				// @ts-expect-error: key is guaranteed to exist
				finalEffect.stats[key] = expr_or_number * effectiveness;
			}
		});
	}

	return finalEffect as FinalizedEffect;
}

export async function pushAllValidEffects(
	effs: UnfinalEffectTypes[],
	reso_counts_: ResoTriggerCounts,
	effects_: FinalizedEffect[],
	stat_: StatCollection[],
	rotation_view_: RotationView,
	weapon_index?: number,
	advancement?: number,
	user_weapons_?: UserWeapon[]
) {
	await Promise.all(
		effs.map(async (eff) => {
			const final_eff = finalizeEffect(
				eff,
				reso_counts_,
				rotation_view_,
				weapon_index,
				advancement,
				user_weapons_
			);

			if (!final_eff) {
				return;
			}

			effects_.push(final_eff);
			stat_[0] = stat_[0].add(new StatCollection(final_eff.stats));
		})
	);
}

// helper function for updateResoEffects
export async function pushValidResoEffect(
	effectIds: ResoEffectsIds[],
	reso_effects_: ResoEffect[]
) {
	await Promise.all(
		effectIds.map(async (eff) => {
			const effect = await getResoEffects(eff);
			if (effect && effect.id && !reso_effects_.some((eff2) => eff2.id === effect.id)) {
				reso_effects_.push(effect);
			}
		})
	);
}

export function dedupeMatEffs(effects: FinalizedMatrixEffect[]) {
	return effects.reduce((acc, effect) => {
		const existing_eff = acc.find((eff) => eff.id === effect.id);

		if (!existing_eff) {
			acc.push(effect);
		} else if (effect.advancement > existing_eff.advancement) {
			acc.splice(acc.indexOf(existing_eff), 1);
			acc.push(effect);
		}

		return acc;
	}, [] as FinalizedMatrixEffect[]);
}

export async function updateSingleWeaponView(index: number) {
	const weapon = get(base_weapons)[index];
	const user_weapons = get(user_loadouts)[get(current_loadout)].equipped_weapons ?? [
		{ id: 'none' },
		{ id: 'none' },
		{ id: 'none' }
	];
	const loadout_reso_counts = get(reso_counts);

	const setting_view_ = await obtainSettingView(user_weapons[index], weapon);

	const loadout_weapon_views = get(weapon_views);
	loadout_weapon_views[index] = await obtainSingleWeaponView(
		user_weapons[index],
		weapon,
		loadout_reso_counts,
		setting_view_,
		get(rotation_view),
		index
	);
	weapon_views.set(loadout_weapon_views);
}

export async function updateSingleMatrixView(index: number) {
	const selected_loadout = get(user_loadouts)[get(current_loadout)];
	const equipped_weapons = selected_loadout.equipped_weapons ?? [
		{ id: 'none' },
		{ id: 'none' },
		{ id: 'none' }
	];
	const user_matrices = selected_loadout.equipped_matrices ?? [
		{ id: 'none' },
		{ id: 'none' },
		{ id: 'none' }
	];

	const matrix = user_matrices[index];

	const loadout_matrix_views = get(matrix_views);
	loadout_matrix_views[index] = await obtainSingleMatrixView(
		equipped_weapons,
		matrix,
		get(reso_counts),
		get(rotation_view),
		index
	);
	matrix_views.set(loadout_matrix_views);
}

export async function updateSingleRelicView(index: number) {
	const selected_loadout = get(user_loadouts)[get(current_loadout)];
	const equipped_relics = selected_loadout.equipped_relics ?? [{ id: 'none' }, { id: 'none' }];
	const relic = equipped_relics[index];

	const loadout_relic_views = get(relic_views);
	loadout_relic_views[index] = await obtainSingleRelicView(
		relic,
		get(reso_counts),
		get(rotation_view)
	);
	relic_views.set(loadout_relic_views);
}

export async function obtainBaseWeapons(equipped_weapons: UserWeapon[]) {
	return await Promise.all(equipped_weapons.map((weapon) => getWeapon(weapon.id)));
}

/** Get count of reso triggers */
export async function obtainResoCounts(
	equipped_weapons: UserWeapon[],
	base_weapons: Weapon[]
): Promise<ResoTriggerCounts> {
	return base_weapons.reduce((counts, weapon, index) => {
		weapon.resonances.forEach((resonance) => {
			counts[resonance] = (counts[resonance] ?? 0) + 1;
		});

		if (weapon.settings) {
			const selected_settings =
				equipped_weapons[index].setting ?? weapon.settings.map((setting) => setting.default) ?? [];

			selected_settings.forEach(async (setting) => {
				const setting_data = await getWeaponSetting(setting);
				if (setting_data.resonances) {
					setting_data.resonances.forEach((resonance) => {
						counts[resonance] = (counts[resonance] ?? 0) + 1;
					});
				}
			});
		}

		return counts;
	}, {} as ResoTriggerCounts);
}

/** Appends values to initial reso counts */
export async function appendResoCounts(
	equipped_weapon: UserWeapon,
	base_weapon: Weapon,
	reso_counts: ResoTriggerCounts
) {
	base_weapon.resonances.forEach((resonance) => {
		reso_counts[resonance] = (reso_counts[resonance] ?? 0) + 1;
	});
	if (base_weapon.settings) {
		const selected_settings =
			equipped_weapon.setting ?? base_weapon.settings.map((setting) => setting.default) ?? [];
		selected_settings.forEach(async (setting) => {
			const setting_data = await getWeaponSetting(setting);
			if (setting_data.resonances) {
				setting_data.resonances.forEach((resonance) => {
					reso_counts[resonance] = (reso_counts[resonance] ?? 0) + 1;
				});
			}
		});
	}

	return reso_counts;
}

/** Expand compound reso triggers to add additional reso
 *  e.g. phys-flame -> phys + flame + armor-dissolve
 */
export async function expandResoCounts(reso_counts: ResoTriggerCounts) {
	Object.entries(reso_counts).forEach(([key, value]) => {
		switch (key) {
			case 'phys-flame':
				reso_counts['phys'] = (reso_counts['phys'] ?? 0) + value;
				reso_counts['flame'] = (reso_counts['flame'] ?? 0) + value;
				reso_counts['armor-dissolve'] = (reso_counts['armor-dissolve'] ?? 0) + value;
				break;
			case 'flame-phys':
				reso_counts['phys'] = (reso_counts['phys'] ?? 0) + value;
				reso_counts['flame'] = (reso_counts['flame'] ?? 0) + value;
				reso_counts['armor-dissolve'] = (reso_counts['armor-dissolve'] ?? 0) + value;
				break;
			case 'frost-volt':
				reso_counts['frost'] = (reso_counts['frost'] ?? 0) + value;
				reso_counts['volt'] = (reso_counts['volt'] ?? 0) + value;
				reso_counts['force-impact'] = (reso_counts['force-impact'] ?? 0) + value;
				break;
			case 'volt-frost':
				reso_counts['frost'] = (reso_counts['frost'] ?? 0) + value;
				reso_counts['volt'] = (reso_counts['volt'] ?? 0) + value;
				reso_counts['force-impact'] = (reso_counts['force-impact'] ?? 0) + value;
				break;
		}
	});

	return reso_counts;
}

export async function obtainResoEffects(
	equipped_weapons: UserWeapon[],
	reso_counts: ResoTriggerCounts,
	base_weapons: Weapon[]
): Promise<ResoEffect[]> {
	const _reso_effects_list: ResoEffect[] = [];

	await Promise.all(
		base_weapons.map(async (weapon, index) => {
			if (weapon.reso_effects) {
				await pushValidResoEffect(weapon.reso_effects, _reso_effects_list);
			}

			if (weapon.settings) {
				const selected_settings =
					equipped_weapons[index].setting ?? weapon.settings.map((setting) => setting.default);

				await Promise.all(
					selected_settings.map(async (setting) => {
						const setting_data = await getWeaponSetting(setting);
						if (setting_data.reso_effects) {
							await pushValidResoEffect(setting_data.reso_effects, _reso_effects_list);
						}
					})
				);
			}
		})
	);
	// add default reso effects
	const default_reso_effects: ResoEffectsIds[] = [
		'atk-reso',
		'atk-reso-teamplay',
		'bene-reso',
		'bene-reso-teamplay',
		'armor-dissolve',
		'armor-dissolve-teamplay',
		'force-impact',
		'force-impact-teamplay'
	];
	await Promise.all(
		default_reso_effects.map(async (reso) => {
			_reso_effects_list.push(await getResoEffects(reso));
		})
	);

	let loadout_resonance_stat = new StatCollection();
	const _reso_effects: ResoEffect[] = [];
	_reso_effects_list.forEach((eff) => {
		if (eff.require_reso) {
			const required_reso_count = eff.require_reso_count ?? 2;
			if ((reso_counts[eff.require_reso] ?? 0) < required_reso_count) {
				return;
			}

			if (eff.require_teamplay) {
				return;
			}

			loadout_resonance_stat = loadout_resonance_stat.add(new StatCollection(eff.stats));
			_reso_effects.push(eff);
		}
	});

	return _reso_effects;
}

async function obtainSettingView(
	equipped_weapon: UserWeapon,
	base_weapon: Weapon
): Promise<SettingView[]> {
	const setting_ids =
		equipped_weapon.setting ?? base_weapon.settings?.map((setting) => setting.default) ?? [];
	const setting: WeaponSetting[] = await Promise.all(
		setting_ids.map(async (setting_) => {
			return await getWeaponSetting(setting_);
		})
	);

	return base_weapon.settings !== undefined
		? await Promise.all(
				setting.map(async (setting_, index) => {
					if (!base_weapon.settings) throw new Error('base_weapon.settings is undefined');
					return {
						...base_weapon.settings[index],
						choice: setting_
					};
				})
			)
		: [];
}

async function obtainSingleWeaponView(
	equipped_weapon: UserWeapon,
	base_weapon: Weapon,
	reso_counts: ResoTriggerCounts,
	setting_view: SettingView[],
	rotation_view: RotationView,
	weapon_index: number
): Promise<WeaponView> {
	const advancement = equipped_weapon.advancement ?? 0;

	// get base stat of weapon
	const _base_stat: { [key in StatKey]?: number } = {};
	Object.entries(WEAPON_BASE_STATS[base_weapon.base_stat]).forEach(([stat, value]) => {
		_base_stat[stat as StatKey] = value[0] + ((value[1] - value[0]) * advancement) / 6;
	});
	const base_stat = new StatCollection(_base_stat);

	// active effects
	const effects: FinalizedEffect[] = [];
	const stat_ = [new StatCollection()];

	await pushAllValidEffects(
		await Promise.all(base_weapon.effects.map((eff) => getWeaponEffect(eff))),
		reso_counts,
		effects,
		stat_,
		rotation_view,
		weapon_index,
		advancement
	);

	if (base_weapon.settings) {
		await Promise.all(
			setting_view.map(async (setting_) => {
				if (setting_.choice.effects) {
					return await pushAllValidEffects(
						await Promise.all(setting_.choice.effects.map((eff) => getWeaponEffect(eff))),
						reso_counts,
						effects,
						stat_,
						rotation_view,
						weapon_index,
						advancement
					);
				}
			})
		);
	}

	const stat = stat_[0];

	return {
		id: base_weapon.id,
		name: base_weapon.name,
		resonances: base_weapon.resonances,
		advancement,
		setting_view,

		base_stat,
		effects,
		stat
	};
}

export async function obtainWeaponViews(
	equipped_weapons: UserWeapon[],
	base_weapons: Weapon[],
	reso_counts: ResoTriggerCounts,
	rotation_view: RotationView,
	setting_views: SettingView[][]
): Promise<WeaponView[]> {
	return await Promise.all(
		base_weapons.map(async (weapon, index) => {
			return obtainSingleWeaponView(
				equipped_weapons[index],
				weapon,
				reso_counts,
				setting_views[index],
				rotation_view,
				index
			);
		})
	);
}

async function obtainSingleMatrixView(
	equipped_weapons: UserWeapon[],
	matrix: UserMatrix,
	reso_counts: ResoTriggerCounts,
	rotation_view: RotationView,
	matrix_index: number
): Promise<MatrixView> {
	const advancement = matrix.advancement ?? 0;

	const effects: FinalizedMatrixEffect[] = [];
	const stat_ = [new StatCollection()];
	const matrix_ = await getMatrix(matrix.id);

	await pushAllValidEffects(
		await Promise.all(matrix_.effects.map((eff) => getMatrixEffect(eff))),
		reso_counts,
		effects,
		stat_,
		rotation_view,
		matrix_index,
		advancement,
		equipped_weapons
	);

	const stat = stat_[0];

	return {
		id: matrix_.id,
		name: matrix_.name,
		advancement,
		effects,
		stat
	};
}

export async function obtainRotationView(
	base_weapons: Weapon[],
	setting_views: SettingView[][]
): Promise<RotationView> {
	const base_rotation_periods = [0, 1, 2].map((index) => {
		return (
			[
				base_weapons[index].rotation_period,
				...setting_views[index].map((setting) => setting.choice.rotation_period)
			].reduce((a, b) => a ?? b, undefined) ?? 30
		);
	});
	const rotation_period = Math.max(...base_rotation_periods);

	const base_atk_priorities = base_weapons.map((weapon) => weapon.onfield_atk_priority ?? 0);
	const highest_atk_priority = Math.max(...base_atk_priorities);
	const primary_weapon = base_atk_priorities.findIndex(
		(atk_priority) => atk_priority === highest_atk_priority
	);

	const base_short_rotation_durations = [0, 1, 2].map((index) => {
		return (
			[
				base_weapons[index].short_rotation_duration,
				...setting_views[index].map((setting) => setting.choice.short_rotation_duration)
			].reduce((a, b) => a ?? b, undefined) ?? 5
		);
	});

	const onfield_times = [0, 1, 2].map((index) => {
		return rotation_period * (base_short_rotation_durations[index] / base_rotation_periods[index]);
	});

	onfield_times[primary_weapon] =
		rotation_period -
		onfield_times.filter((_, indx) => indx !== primary_weapon).reduce((a, b) => a + b, 0);

	return {
		rotation_period,
		primary_weapon,
		onfield_times
	};
}

export async function obtainMatrixViews(
	equipped_weapons: UserWeapon[],
	equipped_matrices: UserMatrix[],
	reso_counts: ResoTriggerCounts,
	rotation_view: RotationView
) {
	return await Promise.all(
		equipped_matrices.map(async (matrix, index) => {
			return obtainSingleMatrixView(equipped_weapons, matrix, reso_counts, rotation_view, index);
		})
	);
}

async function obtainSingleRelicView(
	relic: UserRelic,
	reso_counts: ResoTriggerCounts,
	rotation_view: RotationView
) {
	const advancement = relic.advancement ?? 0;

	const effects: RelicEffect[] = [];
	const stat_ = [new StatCollection()];
	const relic_ = await getRelic(relic.id);

	await pushAllValidEffects(
		await Promise.all(relic_.effects.map((eff) => getRelicEffect(eff))),
		reso_counts,
		effects,
		stat_,
		rotation_view,
		undefined,
		advancement
	);

	const stat = stat_[0];

	return {
		id: relic_.id,
		name: relic_.name,
		advancement,
		effects,
		stat
	} as RelicView;
}

export async function obtainRelicViews(
	equipped_relics: UserRelic[],
	reso_counts: ResoTriggerCounts,
	rotation_view: RotationView
) {
	return await Promise.all(
		equipped_relics.map(async (relic) => {
			return obtainSingleRelicView(relic, reso_counts, rotation_view);
		})
	);
}

export async function obtainTraitView(
	equipped_weapons: UserWeapon[],
	equipped_trait: UserTrait,
	reso_counts: ResoTriggerCounts,
	rotation_view: RotationView
) {
	const effects: FinalizedTraitEffect[] = [];
	const stat_ = [new StatCollection()];

	const trait_ = await getTrait(equipped_trait);

	await pushAllValidEffects(
		await Promise.all(trait_.effects.map((eff) => getTraitEffect(eff))),
		reso_counts,
		effects,
		stat_,
		rotation_view,
		undefined,
		undefined,
		equipped_weapons
	);

	const stat = stat_[0];

	return {
		id: trait_.id,
		name: trait_.name,
		effects,
		stat
	} as TraitView;
}

export async function updateWeaponMatrixRelicTraitFromStore() {
	const selected_loadout: Loadout = get(user_loadouts)[get(current_loadout)];

	const equipped_weapons_: UserWeapon[] = selected_loadout.equipped_weapons ?? [
		{ id: 'none' },
		{ id: 'none' },
		{ id: 'none' }
	];

	const equipped_matrices_: UserMatrix[] = selected_loadout.equipped_matrices ?? [
		{ id: 'none' },
		{ id: 'none' },
		{ id: 'none' }
	];

	const equipped_relics_: UserRelic[] = selected_loadout.equipped_relics ?? [
		{ id: 'none' },
		{ id: 'none' }
	];

	const equipped_trait_: UserTrait = selected_loadout.equipped_trait ?? 'none';

	const base_weapons_ = await obtainBaseWeapons(equipped_weapons_);
	base_weapons.set(base_weapons_);

	const voidpiercer_index = base_weapons_.findIndex((weapon) => weapon.id === 'voidpiercer');

	// exempt voidpiercer
	const reso_counts_ = await obtainResoCounts(
		equipped_weapons_.filter((_, index) => index !== voidpiercer_index),
		base_weapons_.filter((_, index) => index !== voidpiercer_index)
	);

	// if voidpiercer is present, assign voidpiercer element
	if (voidpiercer_index !== -1) {
		if (!equipped_weapons_[voidpiercer_index].setting) {
			console.log('Creating voidpiercer settings');
			equipped_weapons_[voidpiercer_index].setting = ['voidpiercer-alt', 'voidpiercer-starfall'];
		}

		if ((reso_counts_['frost'] ?? 0) + (reso_counts_['frost-volt'] ?? 0) >= 2) {
			equipped_weapons_[voidpiercer_index].setting[0] = 'voidpiercer-frost';
		} else if ((reso_counts_['volt'] ?? 0) + (reso_counts_['volt-frost'] ?? 0) >= 2) {
			equipped_weapons_[voidpiercer_index].setting[0] = 'voidpiercer-volt';
		} else if ((reso_counts_['phys'] ?? 0) + (reso_counts_['phys-flame'] ?? 0) >= 2) {
			equipped_weapons_[voidpiercer_index].setting[0] = 'voidpiercer-phys';
		} else if ((reso_counts_['flame'] ?? 0) + (reso_counts_['flame-phys'] ?? 0) >= 2) {
			equipped_weapons_[voidpiercer_index].setting[0] = 'voidpiercer-flame';
		} else {
			equipped_weapons_[voidpiercer_index].setting[0] = 'voidpiercer-alt';
		}
		// update store
		user_loadouts.update((loadouts) => {
			loadouts[get(current_loadout)].equipped_weapons = equipped_weapons_;
			return loadouts;
		});
		// append reso count
		await appendResoCounts(
			equipped_weapons_[voidpiercer_index],
			base_weapons_[voidpiercer_index],
			reso_counts_
		);
	}

	await expandResoCounts(reso_counts_);
	reso_counts.set(reso_counts_);

	const setting_views_ = await Promise.all(
		[0, 1, 2].map(async (index) => {
			return obtainSettingView(equipped_weapons_[index], base_weapons_[index]);
		})
	);
	const rotation_view_ = await obtainRotationView(base_weapons_, setting_views_);
	rotation_view.set(rotation_view_);

	const reso_effects_ = await obtainResoEffects(equipped_weapons_, reso_counts_, base_weapons_);
	reso_effects.set(reso_effects_);

	const weapon_views_ = await obtainWeaponViews(
		equipped_weapons_,
		base_weapons_,
		reso_counts_,
		rotation_view_,
		setting_views_
	);
	weapon_views.set(weapon_views_);

	const matrix_views_ = await obtainMatrixViews(
		equipped_weapons_,
		equipped_matrices_,
		reso_counts_,
		rotation_view_
	);
	matrix_views.set(matrix_views_);

	const relic_views_ = await obtainRelicViews(equipped_relics_, reso_counts_, rotation_view_);
	relic_views.set(relic_views_);

	const trait_view_ = await obtainTraitView(
		equipped_weapons_,
		equipped_trait_,
		reso_counts_,
		rotation_view_
	);
	trait_view.set(trait_view_);
}

export function getGearTotal() {
	let stat_col = new StatCollection();

	const equipped_gears = get(user_loadouts)[get(current_loadout)].equipped_gears;
	for (const part in equipped_gears) {
		const gear_id = equipped_gears[part as ValidGearPart];
		if (gear_id !== null && gear_id !== -1) {
			const new_stat = new StatCollection(get(gear_views)[gear_id]);
			stat_col = stat_col.add(new_stat);
		}
	}

	return stat_col;
}

export function getWeaponTotal() {
	let stat_col = new StatCollection();

	const all_effects = [
		...get(weapon_views).flatMap((weapon) => weapon.effects),
		...dedupeMatEffs(get(matrix_views).flatMap((matrix) => matrix.effects)),
		...get(reso_effects)
	];
	all_effects.forEach((eff) => {
		stat_col = stat_col.add(new StatCollection(eff.stats));
	});

	// add base stats
	get(weapon_views).forEach((weapon) => {
		stat_col = stat_col.add(weapon.base_stat);
	});

	return stat_col;
}

export function getAllEffects(
	selected_loadout: Loadout,
	equipped_gear_views: GearView[],
	weapon_views: WeaponView[],
	matrix_views: MatrixView[],
	reso_effects: ResoEffect[],
	relic_views: RelicView[],
	trait_view: TraitView | null
): AllEffectTypes[] {
	const stat_adj = selected_loadout.stat_adj;

	const unacc_eff = {
		id: 'unaccounted',
		stats: stat_adj?.unaccounted ?? {}
	} as OtherEffect;

	const supercompute_eff = {
		id: 'supercompute',
		stats: {
			atk_percent: stat_adj?.supercompute ?? 0
		}
	} as OtherEffect;

	const blade_shot_eff = {
		id: 'enhanced-blade-shot',
		stats: {
			atk_percent: stat_adj?.use_blade_shot ? 3.5 : 0
		}
	} as OtherEffect;

	const base_stat_col = new StatCollection(selected_loadout.base_stats);

	return [
		...(stat_adj?.unaccounted ? [unacc_eff] : []), // unaccounted
		...(stat_adj?.supercompute ? [supercompute_eff] : []), // supercompute
		...(stat_adj?.use_blade_shot ? [blade_shot_eff] : []), // blade shot
		...weapon_views.flatMap((weapon) => weapon.effects), // weapon effects
		...weapon_views.map((weapon) => turnWeaponBaseStatToEffect(weapon, base_stat_col)), // weapon base stats
		...dedupeMatEffs(matrix_views.flatMap((matrix) => matrix.effects)), // matrix effects
		...reso_effects, // reso effects
		...equipped_gear_views.flatMap((gear) => turnGearToEffect(gear, base_stat_col)), // gear
		...relic_views.flatMap((relic) => relic.effects), // relics
		...(trait_view?.effects ?? []) // trait
	]; // NOTE: DOESNT INCLUDE WEAPON BASE STATS
}

export function getAllEffectsFromStore() {
	return getAllEffects(
		get(user_loadouts)[get(current_loadout)],
		get(equipped_gear_views),
		get(weapon_views),
		get(matrix_views),
		get(reso_effects),
		get(relic_views),
		get(trait_view)
	);
}

export function getAllStats(
	selected_loadout: Loadout,
	equipped_gear_views: GearView[],
	weapon_views: WeaponView[],
	matrix_views: MatrixView[],
	reso_effects: ResoEffect[]
) {
	const stat_adj = selected_loadout.stat_adj;

	let gwmr_totals = new StatCollection();
	equipped_gear_views.forEach((gear) => {
		// gear titan stats
		gwmr_totals = gwmr_totals.add(new StatCollection(gear));
	});
	[
		...weapon_views.flatMap((weapon) => weapon.effects), // weapon effects
		...dedupeMatEffs(matrix_views.flatMap((matrix) => matrix.effects)), // matrix effects
		...reso_effects // reso effects
	].forEach((eff) => {
		gwmr_totals = gwmr_totals.add(new StatCollection(eff.stats));
	});
	weapon_views.forEach((weapon) => {
		gwmr_totals = gwmr_totals.add(weapon.base_stat); // weapon base stats
	});

	return new StatCollection(selected_loadout.base_stats) // base stats
		.add(new StatCollection(stat_adj?.unaccounted ?? {})) // unaccounted
		.add(new StatCollection('atk_percent', stat_adj?.supercompute ?? 0)) // supercompute
		.add(new StatCollection('atk_percent', stat_adj?.use_blade_shot ? 3.5 : 0)) // blade shot
		.add(gwmr_totals);
}

export function getAllStatsFromStore() {
	return getAllStats(
		get(user_loadouts)[get(current_loadout)],
		get(equipped_gear_views),
		get(weapon_views),
		get(matrix_views),
		get(reso_effects)
	);
}

export function createStatView(
	selected_loadout: Loadout,
	equipped_gear_views: GearView[],
	weapon_views: WeaponView[],
	matrix_views: MatrixView[],
	reso_effects: ResoEffect[]
) {
	const total_base_stats = getAllStats(
		selected_loadout,
		equipped_gear_views,
		weapon_views,
		matrix_views,
		reso_effects
	).to_displayed_stats();

	const base_stats_ = [
		...total_base_stats.slice(0, 8),
		'1400',
		'0',
		...total_base_stats.slice(8, 14)
	] as BaseStats16;

	if (base_stats_.length !== 16) {
		throw new Error('Invalid base stats length!');
	}

	return TEMPLATE_USER_ATTRIBUTES.map((attr, index) => {
		const __val = base_stats_[index];
		const __use_percent = index === 2 || index === 10;

		return {
			...attr,
			name: STAT_LABELS[attr.key],
			value: __use_percent ? formatValue('float3d', __val) : formatValue('int', __val)
		};
	});
}

export function createStatViewFromStore() {
	return createStatView(
		get(user_loadouts)[get(current_loadout)],
		get(equipped_gear_views),
		get(weapon_views),
		get(matrix_views),
		get(reso_effects)
	);
}

export function getEquippedGearViews(equipped_gears?: EquippedGear): GearView[] {
	if (!equipped_gears) {
		equipped_gears = {
			H: null,
			S: null,
			A: null,
			C: null,
			B: null,
			L: null,
			G: null,
			T: null,
			V: null,
			N: null,
			X: null,
			R: null
		};
	}

	const gear_views_ = get(gear_views);

	const equipped_gear_views: GearView[] = [];
	for (const part in equipped_gears) {
		const gear_id = equipped_gears[part as ValidGearPart];
		if (gear_id !== null && gear_id !== -1) {
			equipped_gear_views.push(gear_views_[gear_id]);
		}
	}
	return equipped_gear_views;
}

const TRANSFORMABLE_KEYS = ['phys_atk', 'flame_atk', 'frost_atk', 'volt_atk', 'alt_atk'];

/**
 * Turns base stats into improvement percent
 * @param {StatCollection} stat_col_
 * @param {StatCollection} base_stats - actual base stats turned into stat collection
 * @returns
 */
export function turnBaseStatToPercent(stat_col_: StatCollection, base_stats: StatCollection) {
	const stat_col = stat_col_.clone();

	// lump atk to all elements
	const _atk_stat = stat_col.pop('atk');
	if (_atk_stat) {
		stat_col.put('phys_atk', _atk_stat + stat_col.get('phys_atk'));
		stat_col.put('flame_atk', _atk_stat + stat_col.get('flame_atk'));
		stat_col.put('frost_atk', _atk_stat + stat_col.get('frost_atk'));
		stat_col.put('volt_atk', _atk_stat + stat_col.get('volt_atk'));
	}
	const alt_max = Math.max(
		base_stats.get('phys_atk'),
		base_stats.get('flame_atk'),
		base_stats.get('frost_atk'),
		base_stats.get('volt_atk')
	);

	Object.keys(stat_col.data).forEach((key) => {
		if (TRANSFORMABLE_KEYS.includes(key as (typeof TRANSFORMABLE_KEYS)[number])) {
			if (key === 'alt_atk') {
				stat_col.put(
					`base_${key}_improvement_percent` as StatAtkImprovement,
					// @ts-expect-error : key is guaranteed to exist
					(stat_col.pop(key) / alt_max) * 100
				);
			} else {
				stat_col.put(
					`base_${key}_improvement_percent` as StatAtkImprovement,
					// @ts-expect-error : key is guaranteed to exist
					(stat_col.pop(key) / base_stats.get(key)) * 100
				);
			}
		} else {
			// @ts-expect-error : key is guaranteed to exist
			stat_col.pop(key);
		}
	});

	return stat_col;
}

/**
 * Turns a weapon base stat into weapon base effect
 * @param weapon
 * @param base_stat_col
 */
export function turnWeaponBaseStatToEffect(weapon: WeaponView, base_stat_col: StatCollection) {
	const base_stat_col_tf = turnBaseStatToPercent(weapon.base_stat, base_stat_col);

	return {
		id: `${weapon.id}-base`,
		stats: base_stat_col_tf.data
	} as WeaponBaseEffect;
}

/**
 * Turns a gear into a gear effect
 * @param {GearView} gear
 * @returns {GearEffect}
 */
export function turnGearToEffect(gear: GearView, base_stat_col: StatCollection): GearEffect {
	if (gear.part === 'U') throw new Error('Cannot turn UNKNOWN gear into effect!');

	const gear_stat_col_tf = turnBaseStatToPercent(new StatCollection(gear), base_stat_col);

	return {
		id: `gear-${gear.part}`,
		stats: gear_stat_col_tf.data
	};
}

/**
 * Applies extra stats to gear views
 * Takes in gear_views, all_stats, and equipped_gear_views from store, then modifies gear_views again
 */
export async function applyExtraGearViewStats() {
	const gear_views_ = get(gear_views);

	// create map of gear to equipped
	const all_stats_ = get(all_stats);
	const eq_gear_views = get(equipped_gear_views);

	const all_stats_lump = all_stats_.lump();

	const all_stats_minus_eq_gear: Record<ValidGearPart, LumpedStatCollection> = {
		H: all_stats_lump,
		S: all_stats_lump,
		A: all_stats_lump,
		C: all_stats_lump,
		B: all_stats_lump,
		L: all_stats_lump,
		G: all_stats_lump,
		T: all_stats_lump,
		V: all_stats_lump,
		N: all_stats_lump,
		X: all_stats_lump,
		R: all_stats_lump
	};
	await Promise.all(
		eq_gear_views.map(async (gear) => {
			if (gear.part === 'U') {
				return;
			}
			all_stats_minus_eq_gear[gear.part] = all_stats_.subtract(new StatCollection(gear)).lump();
		})
	);

	const loadout_element = get(user_loadouts)[get(current_loadout)].element;

	const new_gear_views_ = Promise.all(
		gear_views_.map(async (gear) => {
			const new_gear = { ...gear };

			// multipliers
			const multiplier_index = new_gear.derived.findIndex((stat) => stat.stat === 'multiplier');
			const multiplier_value = all_stats_minus_eq_gear[
				gear.part as ValidGearPart
			].total_multiplier_of(new StatCollection(new_gear).lump(), loadout_element);
			const multiplier_value_percent = (multiplier_value - 1) * 100;

			const multiplier_stat: GearViewStatShort = {
				stat: 'multiplier',
				stat_label: 'Multiplier',
				value: multiplier_value,
				value_label: formatValue('float3d', multiplier_value)
			};
			const multiplier_percent_stat: GearViewStatShort = {
				stat: 'multiplier_percent',
				stat_label: 'Multiplier Percent',
				value: multiplier_value_percent,
				value_label: formatValue('float2d', multiplier_value_percent)
			};
			if (multiplier_index === -1) {
				new_gear.derived.push(multiplier_stat);
				new_gear.derived.push(multiplier_percent_stat);
			} else {
				new_gear.derived[multiplier_index] = multiplier_stat;
				new_gear.derived[multiplier_index + 1] = multiplier_percent_stat;
			}

			return new_gear;
		})
	);

	gear_views.set(await new_gear_views_);
}
