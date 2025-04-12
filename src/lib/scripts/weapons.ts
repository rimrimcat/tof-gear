import type { EffectsIds, ResoEffectsIds, WeaponsIds } from '../generated/ids';
import type { StatCollection, StatData } from './stat-ops';
import type { StatGearUser, StatNonGear } from './stats';

export type ResoTriggers = 'atk' | 'fort' | 'bene' | 'phys' | 'flame' | 'frost' | 'volt' | 'alt';
type Target = 'self' | 'ally' | 'team' | 'enemy';
export type ResoTriggerCounts = { [key in ResoTriggers]?: number };

export type Effect = {
	id: EffectsIds;
	stats: StatData;
	duration?: number; // cooldown and duration only matter if not 100% uptime or if onfield
	cooldown?: number;
	target: Target;
	required_reso?: ResoTriggers;
	required_reso_count?: number; // defaults to 2
	required_adv?: number;
	require_teamplay?: boolean;
	notes?: string;
};

export type ResoEffect = {
	id: string;
	stats: StatData;
	duration?: number;
	cooldown?: number;
	target: Target;
	required_reso: ResoTriggers;
	required_reso_count?: number; // defaults to 2
	require_teamplay?: boolean;
	notes?: string;
};

/**
 * BaseStatType naming convetion:
 *   [third stat]-[atk value]
 *   third stat: crit, res
 *   atk value: low, med, high
 */
type BaseStatType = 'crit-low' | 'crit-med' | 'crit-high' | 'res-low' | 'res-med' | 'res-high';
type BaseStatValue = {
	[key in StatGearUser | StatNonGear]?: [number, number];
};

/**
 * A0 LVL 200 values taken from toweroffantasy.info. Need someone to verify.
 */
export const WEAPON_BASE_STATS: Record<BaseStatType, BaseStatValue> = {
	'crit-high': {
		atk: [656, 1627],
		crit: [468, 937],
		hp: [39999, 79999]
	},
	'crit-med': {
		atk: [650, 1612],
		crit: [499, 998],
		hp: [39999, 79999]
	},
	'crit-low': {
		atk: [650, 1611],
		crit: [499, 1000],
		hp: [39999, 79999]
	},
	'res-high': {
		atk: [500, 1160],
		res: [312, 624],
		hp: [39999, 86400]
	},
	'res-med': {
		atk: [500, 1080],
		res: [312, 624],
		hp: [39999, 92800]
	},
	'res-low': {
		atk: [531, 1062],
		res: [273, 546],
		hp: [39999, 99200]
	}
};

export type Weapon = {
	id: WeaponsIds;
	name: string;
	base_stat: BaseStatType;
	resonances: ResoTriggers[];
	onfieldness?: number; // priority for onfielding, need to determine this later on
	effects: EffectsIds[];
	reso_effects?: ResoEffectsIds[];
};

export type UserWeapon = {
	id: WeaponsIds;
	advancement?: number;
};

export type WeaponView = {
	id: WeaponsIds;
	name: string;
	resonances: ResoTriggers[];
	onfieldness?: number;

	base_stat: StatCollection;
	stat: StatCollection;

	effects: Effect[];

	advancement: number;
};
