import type { GearPart, ValidGearPart } from '../scripts/gears';
import type { StatGearTitan, StatGearUser } from './stat-types';
export type { GearPart, ValidGearPart } from '../scripts/gears';

export type StatGearExtra = 'multiplier' | 'multiplier_percent';

export type GearAugment =
	| 'delay'
	| 'increased_healing'
	| 'lifesteal'
	| 'hp_recovery'
	| 'block'
	| 'dmg_reduction'
	| 'dmg_boost'
	| 'weakpoint_dmg_boost'
	| 'normal_atk_dmg_boost'
	| 'dodge_atk_dmg_boost'
	| 'skill_dmg_boost'
	| 'discharge_dmg_boost';

/**
 * Basic info for a gear piece
 * @property {number} id - Unique numerical identifier
 * @property {GearParts} part - Gear slot
 */
export type GearBase = {
	id: number;
	part: ValidGearPart | GearPart.UNKNOWN | 'U';
	augment?: [GearAugment, number];
};

/**
 * Valid stats that can be present on a gear piece
 */
export type GearValidStats = {
	[key in StatGearUser | StatGearTitan]?: string;
};

/**
 * Represents a single stat on a gear piece with its value
 * @property {StatGearUser} stat - The type of stat
 * @property {string} stat_label - Display string for the stat
 * @property {number} value - Numerical value of the stat
 * @property {string} value_label - Formatted string representation of the value
 * @property {number} [roll] - Optional roll value indicating stat quality
 */
export type GearViewStatLong = {
	stat: StatGearUser;
	stat_label: string;
	value: number;
	value_label: string;
	roll: number;
	// titan
	titan_stat_label: string;
	titan_value_label: string;
};

/**
 * Represents a derived stat from gear stats
 * @property {StatGearUser | StatGearTitan} stat - The type of stat
 * @property {string} stat_label - Display string for the stat
 * @property {number} value - Numerical value of the stat
 * @property {string} value_label - Formatted string representation of the value
 */
export type GearViewStatShort = {
	stat: StatGearUser | StatGearTitan | StatGearExtra;
	stat_label: string;
	value: number;
	value_label: string;
};

/**
 * Represents raw gear data as stored/input by the user
 * @property {string} dateAdded - Date the gear was added, in ISO string
 */
export type UserGear = GearValidStats & GearBase & { dateAdded: string };

/**
 * Processed gear data for display and sorting
 * @property {GearViewStatLong[]} stats - Array of processed stat items
 * @property {GearViewStatShort[]} derived - Calculated stats for sorting purposes
 * @property {string} hash - Unique identifier for the gear
 * @property {boolean} isEquipped - Indicates if the gear is currently equipped, see also AllLoadouts
 */
export type GearView = GearBase & {
	stats: GearViewStatLong[];
	derived: GearViewStatShort[];
	hash: string;
	isEquipped: boolean;
};

/**
 * Gear data for search result
 * @property {number} id - Sequential identifier
 * @property {GearPart} part - Gear slot
 * @property {GearViewStatShort[]} stats - Array of processed stat items, references GearView's derived key
 */
export type GearSearchView = GearBase & {
	stats: GearViewStatShort[];
};
