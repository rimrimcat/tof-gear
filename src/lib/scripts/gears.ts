import type {
	GearAugment,
	GearView,
	GearViewStatLong,
	GearViewStatShort,
	StatGearExtra,
	StatGearTitan,
	StatGearUser,
	UserGear
} from '$lib/types';
import { get } from 'svelte/store';
import { STAT_CONSTANTS } from './json-loader';
import { STAT_LABELS } from './stats';
import { current_loadout, gear_views, user_gears, user_loadouts } from './stores';
import { formatValue } from './validation';

/**
 * Enum for different gear slots
 */
export enum GearPart {
	HELMET = 'H',
	SPAULDERS = 'S',
	ARMOR = 'A',
	BRACERS = 'C',
	BELT = 'B',
	LEGGUARDS = 'L',
	//
	GLOVES = 'G',
	BOOTS = 'T',
	//
	VISOR = 'V',
	ENGINE = 'N',
	EXOSKELETON = 'X',
	REACTOR = 'R',
	//
	UNKNOWN = 'U'
}

export const GEAR_LABELS: { [key in GearPart]?: string } = {
	H: 'Helmet',
	S: 'Spaulders',
	A: 'Armor',
	C: 'Bracers',
	B: 'Belt',
	L: 'Legguards',
	G: 'Gloves',
	T: 'Boots',
	V: 'Visor',
	N: 'Engine',
	X: 'Exoskeleton',
	R: 'Reactor'
};

export type ValidGearPart =
	| 'H'
	| 'S'
	| 'A'
	| 'C'
	| 'B'
	| 'L'
	| 'G'
	| 'T'
	| 'V'
	| 'N'
	| 'X'
	| 'R'
	| GearPart.SPAULDERS
	| GearPart.ARMOR
	| GearPart.BRACERS
	| GearPart.BELT
	| GearPart.LEGGUARDS
	| GearPart.GLOVES
	| GearPart.BOOTS
	| GearPart.VISOR
	| GearPart.ENGINE
	| GearPart.EXOSKELETON
	| GearPart.REACTOR;

export const VALID_GEAR_PARTS: ValidGearPart[] = [
	'H',
	'S',
	'A',
	'C',
	'B',
	'L',
	'G',
	'T',
	'V',
	'N',
	'X',
	'R'
];

export const GEAR_AUGMENT_LABELS: Record<GearAugment, string> = {
	delay: 'Delay',
	increased_healing: 'Healing',
	lifesteal: 'Lifesteal',
	hp_recovery: 'Recovery',
	block: 'Block',
	dmg_reduction: 'Dmg Reduction',
	dmg_boost: 'Dmg Boost',
	weakpoint_dmg_boost: 'Weakpoint',
	normal_atk_dmg_boost: 'Normal Atk',
	dodge_atk_dmg_boost: 'Dodge Atk',
	skill_dmg_boost: 'Skill',
	discharge_dmg_boost: 'Discharge'
};

const __ELE_ATK: StatGearUser[] = ['flame_atk', 'frost_atk', 'volt_atk', 'phys_atk'];
const __ELE_ATK_PERCENT: StatGearUser[] = [
	'flame_atk_percent',
	'frost_atk_percent',
	'volt_atk_percent',
	'phys_atk_percent'
];
const __ELE_DMG_PERCENT: StatGearUser[] = [
	'flame_dmg_percent',
	'frost_dmg_percent',
	'volt_dmg_percent',
	'phys_dmg_percent'
];
const __ELE_RES: StatGearUser[] = ['flame_res', 'frost_res', 'volt_res', 'phys_res'];
const __ELE_RES_PERCENT: StatGearUser[] = [
	'flame_res_percent',
	'frost_res_percent',
	'volt_res_percent',
	'phys_res_percent'
];

// normal stats
const GEAR_STATS: StatGearUser[] = [
	'hp',
	'hp_percent',
	'atk',
	...__ELE_ATK,
	'alt_atk',
	...__ELE_ATK_PERCENT,
	'alt_atk_percent',
	...__ELE_DMG_PERCENT,
	'crit',
	'crit_percent',
	'res',
	...__ELE_RES,
	'alt_res',
	...__ELE_RES_PERCENT
];
// titan stats
const GEAR_STATS_TITAN: StatGearTitan[] = [
	'titan_hp',
	'titan_hp_percent',
	'titan_atk',
	'titan_flame_atk',
	'titan_frost_atk',
	'titan_volt_atk',
	'titan_phys_atk',
	'titan_alt_atk',
	'titan_flame_atk_percent',
	'titan_frost_atk_percent',
	'titan_volt_atk_percent',
	'titan_phys_atk_percent',
	'titan_alt_atk_percent',
	'titan_flame_dmg_percent',
	'titan_frost_dmg_percent',
	'titan_volt_dmg_percent',
	'titan_phys_dmg_percent',
	'titan_crit',
	'titan_crit_percent',
	'titan_res',
	'titan_flame_res',
	'titan_frost_res',
	'titan_volt_res',
	'titan_alt_res',
	'titan_phys_res',
	'titan_flame_res_percent',
	'titan_frost_res_percent',
	'titan_volt_res_percent',
	'titan_alt_res_percent',
	'titan_phys_res_percent'
];

const __COMMON: StatGearUser[] = ['hp', 'atk', ...__ELE_ATK, 'res', ...__ELE_RES];

export const VALID_GEAR_RANDOM_STATS: Record<ValidGearPart, StatGearUser[]> = {
	H: __COMMON,
	S: __COMMON,
	A: __COMMON,
	C: __COMMON,
	B: __COMMON,
	L: __COMMON,
	G: [...__COMMON, 'crit'],
	T: [...__COMMON, 'crit'],
	V: [
		...__COMMON,
		'crit_percent',
		...__ELE_ATK_PERCENT,
		'alt_atk',
		'alt_atk_percent',
		...__ELE_RES_PERCENT,
		'alt_res',
		'alt_res_percent',
		'hp_percent'
	],
	N: [...__COMMON, ...__ELE_ATK_PERCENT, ...__ELE_DMG_PERCENT, ...__ELE_RES_PERCENT, 'hp_percent'],
	X: [...__COMMON, ...__ELE_ATK_PERCENT, ...__ELE_DMG_PERCENT, ...__ELE_RES_PERCENT, 'hp_percent'],
	R: [...__COMMON, ...__ELE_ATK_PERCENT, ...__ELE_DMG_PERCENT, ...__ELE_RES_PERCENT, 'hp_percent']
};

export const VALID_GEAR_AUGMENT_STATS: Record<ValidGearPart, GearAugment[]> = {
	H: [
		'delay',
		'increased_healing',
		'normal_atk_dmg_boost',
		'weakpoint_dmg_boost',
		'dodge_atk_dmg_boost',
		'dmg_boost'
	],
	S: [
		'delay',
		'increased_healing',
		'discharge_dmg_boost',
		'weakpoint_dmg_boost',
		'normal_atk_dmg_boost',
		'dmg_boost'
	],
	A: [
		'delay',
		'increased_healing',
		'discharge_dmg_boost',
		'weakpoint_dmg_boost',
		'dodge_atk_dmg_boost',
		'dmg_boost'
	],
	G: [
		'delay',
		'increased_healing',
		'normal_atk_dmg_boost',
		'weakpoint_dmg_boost',
		'skill_dmg_boost',
		'dmg_boost'
	],
	C: [
		'delay',
		'increased_healing',
		'discharge_dmg_boost',
		'weakpoint_dmg_boost',
		'skill_dmg_boost',
		'dmg_boost'
	],
	B: [
		'lifesteal',
		'hp_recovery',
		'block',
		'dmg_reduction',
		'dodge_atk_dmg_boost',
		'skill_dmg_boost'
	],
	L: [
		'lifesteal',
		'hp_recovery',
		'block',
		'dmg_reduction',
		'normal_atk_dmg_boost',
		'dodge_atk_dmg_boost'
	],
	T: [
		'lifesteal',
		'hp_recovery',
		'block',
		'dmg_reduction',
		'normal_atk_dmg_boost',
		'skill_dmg_boost'
	],
	V: [
		'lifesteal',
		'hp_recovery',
		'block',
		'dmg_reduction',
		'normal_atk_dmg_boost',
		'discharge_dmg_boost'
	],
	N: [
		'delay',
		'increased_healing',
		'dodge_atk_dmg_boost',
		'weakpoint_dmg_boost',
		'skill_dmg_boost',
		'normal_atk_dmg_boost'
	],
	X: [
		'lifesteal',
		'hp_recovery',
		'block',
		'dmg_reduction',
		'skill_dmg_boost',
		'discharge_dmg_boost'
	],
	R: [
		'lifesteal',
		'hp_recovery',
		'block',
		'dmg_reduction',
		'dodge_atk_dmg_boost',
		'discharge_dmg_boost'
	]
};

// extra stats
const GEAR_STATS_EXTRA: StatGearExtra[] = ['multiplier', 'multiplier_percent'];
// other literals, MUST NOT BE INCLUDED IN REGEX

const GEAR_OTHER = ['gear', 'isEquipped'];

const ALL_STATS_LIST = [...GEAR_STATS, ...GEAR_STATS_TITAN, ...GEAR_STATS_EXTRA];

const _ALL_WITH_OTHERS = [...ALL_STATS_LIST, ...GEAR_OTHER];
export const ALL_STATS_REGEX = new RegExp(`\\b(${_ALL_WITH_OTHERS.join('|')})\\b`, 'g');

const __allowedRegexLits = [
	'\\+',
	'\\(',
	'\\ ',
	'\\)',
	'\\<',
	'\\=',
	'\\>',
	'\\*',
	'\\d',
	'\\!',
	"'gear'", // will be replaced by string character for equality comparison
	'isEquipped', // 0 or 1
	...Object.values(GearPart).map((value) => `'${value}'`)
].join('|');
const __allowedRegexVars = [...ALL_STATS_LIST].join('|');

// used by Gear Search
export const ALLOWED_REGEX_VARS = new RegExp(`\\b(${__allowedRegexVars})\\b`, 'g');
// used by Gear Search
export const ALLOWED_REGEX_OPS = new RegExp(`(${__allowedRegexLits})`, 'g');

// gear views
export const RAINBOW_TITAN_ATK: StatGearTitan[] = [
	'titan_flame_atk',
	'titan_frost_atk',
	'titan_volt_atk',
	'titan_phys_atk'
];
export const RAINBOW_TITAN_ATK_PERCENT: StatGearTitan[] = [
	'titan_flame_atk_percent',
	'titan_frost_atk_percent',
	'titan_volt_atk_percent',
	'titan_phys_atk_percent'
];

export function getRollValue(stat: StatGearUser, value: number): number {
	const stc = STAT_CONSTANTS[stat];
	return ((value - stc.base) * 2) / (stc.high_roll + stc.low_roll);
}

export function getTitanValue(stat: StatGearUser, value: number): number {
	const stc = STAT_CONSTANTS[stat];
	return stc.titan_base + stc.titan_multiplier * (value - stc.base);
}

export function reverseTitanValue(stat: StatGearUser, titanValue: number): number {
	const stc = STAT_CONSTANTS[stat];
	return (
		(titanValue - stc.titan_base + stc.titan_multiplier * stc.base) / (1 + stc.titan_multiplier)
	);
}

function applyRainbow(
	RAINBOW_STATS: StatGearTitan[],
	derived_: GearViewStatShort[],
	value: number,
	value_label: string
) {
	RAINBOW_STATS.forEach((rainbowStat) => {
		const statIdx = derived_.findIndex((der) => der.stat === rainbowStat);

		if (statIdx === -1) {
			// add rainbow stat if missing
			derived_.push({
				stat: rainbowStat,
				stat_label: STAT_LABELS[rainbowStat],
				value,
				value_label
			});
		} else {
			// replace value if rainbow is higher
			if (value > derived_[statIdx].value) {
				derived_[statIdx].value = value;
				derived_[statIdx].value_label = value_label;
			}
		}
	});
}

export async function createGearView(gear: UserGear, equip: boolean = false): Promise<GearView> {
	const stats: GearViewStatLong[] = [];
	const derived: GearViewStatShort[] = [];
	let id: number = -1;
	let part: GearPart = GearPart.UNKNOWN;
	let hash = '';
	let augment: [GearAugment, number] | undefined = undefined;

	Object.entries(gear).forEach(([key, value]) => {
		switch (key) {
			case 'id':
				id = value as number;
				break;
			case 'part':
				part = value as GearPart;
				hash += value;
				break;
			case 'dateAdded':
				break;
			case 'augment':
				augment = value as [GearAugment, number];
				break;
			default: {
				const isTitan = key.startsWith('titan_');
				const value_format = key.includes('_percent') ? 'float3d' : 'int';

				let _stat: StatGearUser;
				let _stat_value: number;
				let stat_label: string;
				let stat_value_label: string;

				let titan_key: StatGearTitan;
				let titan_label: string;
				let titan_value: number;
				let titan_value_label: string;

				if (isTitan) {
					// derive normal stat from corresponding titan stat
					titan_key = key as StatGearTitan;
					titan_label = STAT_LABELS[titan_key] ?? key;
					titan_value = Number(value);
					titan_value_label = formatValue(value_format, value as string);

					_stat = key.replace('titan_', '') as StatGearUser;
					_stat_value = reverseTitanValue(_stat, titan_value);
					stat_label = STAT_LABELS[_stat] ?? key;
					stat_value_label = formatValue(value_format, _stat_value.toString());
				} else {
					_stat = key as StatGearUser;
					_stat_value = Number(value);
					stat_label = STAT_LABELS[_stat] ?? key;
					stat_value_label = formatValue(value_format, _stat_value.toString());

					titan_key = 'titan_' + _stat;
					titan_label = 'Titan ' + stat_label;
					titan_value = getTitanValue(_stat, _stat_value) + _stat_value;
					titan_value_label = formatValue(value_format, titan_value.toString());
				}

				stats.push({
					stat: _stat,
					stat_label,
					value: _stat_value,
					value_label: stat_value_label,
					roll: getRollValue(_stat, _stat_value),
					titan_stat_label: titan_label,
					titan_value_label: titan_value_label
				});

				// normal stat
				derived.push({
					stat: _stat,
					stat_label,
					value: _stat_value,
					value_label: stat_value_label
				});

				// titan stat
				derived.push({
					stat: titan_key as StatGearTitan,
					stat_label: titan_label,
					value: titan_value,
					value_label: titan_value_label
				});

				hash += _stat + stat_value_label;

				break;
			}
		}
	});
	stats.sort((a, b) => (b.roll ?? 0) - (a.roll ?? 0));

	const bestRoll = stats[0];

	// FOR NOW, LENIENT MAX STAT DETECTION
	if (bestRoll.stat.includes('_atk') && !bestRoll.stat.includes('percent')) {
		const eleAtkStats = stats.filter(
			(stat) => stat.stat.includes('_atk') && !stat.stat.includes('percent')
		);

		if (eleAtkStats.length >= 1) {
			// rainbow gear!

			const rainbowTitanValue =
				getTitanValue(bestRoll.stat, bestRoll.value) * 0.95 + bestRoll.value;
			const rainbowTitanValueLabel = formatValue('int', rainbowTitanValue.toString());

			applyRainbow(RAINBOW_TITAN_ATK, derived, rainbowTitanValue, rainbowTitanValueLabel);
		}
	} else if (bestRoll.stat.includes('_atk') && bestRoll.stat.includes('percent')) {
		const eleAtkPercentStats = stats.filter(
			(stat) => stat.stat.includes('_atk') && stat.stat.includes('percent')
		);

		if (eleAtkPercentStats.length >= 1) {
			const rainbowTitanValue =
				getTitanValue(bestRoll.stat, bestRoll.value) * 0.95 + bestRoll.value;
			const rainbowTitanValueLabel = formatValue('float3d', rainbowTitanValue.toString());

			applyRainbow(RAINBOW_TITAN_ATK_PERCENT, derived, rainbowTitanValue, rainbowTitanValueLabel);
		}
	}

	const isEquipped =
		equip ||
		(part !== GearPart.UNKNOWN &&
			get(user_loadouts)[get(current_loadout)].equipped_gears[gear.part as ValidGearPart] ===
				gear.id);

	return {
		id,
		part,
		stats,
		hash,
		derived,
		isEquipped,
		augment
	};
}

export async function createAllGearViewsFromLoadout() {
	gear_views.set(await Promise.all(get(user_gears).map((gear) => createGearView(gear, false))));
}
