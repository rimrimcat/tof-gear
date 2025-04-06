import { StatGearTitan, StatGearUser } from '$lib/scripts/stats';

/**
 * Enum for different gear slots
 */
export enum GearParts {
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

/**
 * Identification for a gear piece
 * @property {number} id - Unique numerical identifier
 * @property {GearParts} part - Gear slot
 */
type GearId = {
	id: number;
	part: GearParts;
};

/**
 * Valid stats that can be present on a gear piece
 */
type GearValidStats = {
	[key in StatGearUser]?: string;
};

// /**
//  * Derived titan statistics calculated from gear stats
//  */
// type GearDerivedTitanStats = {
// 	[key in StatGearTitan]?: number;
// };

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
	stat: StatGearUser | StatGearTitan;
	stat_label: string;
	value: number;
	value_label: string;
};

/**
 * Represents raw gear data as stored/input by the user
 */
export type UserGear = GearId & GearValidStats;

/**
 * Processed gear data for display and sorting
 * @property {GearViewStatLong[]} stats - Array of processed stat items
 * @property {GearViewStatShort[]} derived - Calculated stats for sorting purposes
 */
export type GearView = GearId & {
	stats: GearViewStatLong[];
	hash: string;
	derived: GearViewStatShort[];
};

/**
 * Gear data for search result
 * @property {GearViewStatShort[]} stats - Array of processed stat items, references GearView's derived key
 */
export type GearSearchView = GearId & {
	stats: GearViewStatShort[];
};
