import { browser } from '$app/environment';
import type {
	Matrix,
	MatrixEffect,
	MatrixEffectsIds,
	MatrixIds,
	Relic,
	RelicEffect,
	RelicEffectsIds,
	RelicsIds,
	ResoEffect,
	ResoEffectsIds,
	StatConstants,
	Trait,
	TraitEffect,
	TraitEffectsIds,
	TraitsIds,
	Weapon,
	WeaponEffect,
	WeaponEffectsIds,
	WeaponSetting,
	WeaponSettingsIds,
	WeaponsIds
} from '../types/index';

// load once before using
export let STAT_CONSTANTS: StatConstants;

export async function loadStatConstants(): Promise<void> {
	if (STAT_CONSTANTS) {
		console.log('Stat constants already loaded!');
		return;
	}

	if (!browser) {
		console.log('Not in browser environment, skipping stat constants loading.');
		return;
	}

	try {
		const response = await fetch('./json/stat-constants.json');
		if (!response.ok) {
			throw new Error(`Failed to load stat constants: ${response.statusText}`);
		}

		const data = await response.json();
		STAT_CONSTANTS = data as StatConstants;
		console.log('Stat constants loaded!');
	} catch (error) {
		console.error('Error loading stat constants:', error);
		throw error;
	}
}

// loaded when needed
const RESO_EFFECTS: { [key in ResoEffectsIds]?: ResoEffect } = {};
const WEAPON_EFFECTS: { [key in WeaponEffectsIds]?: WeaponEffect } = {};
const MATRIX_EFFECTS: { [key in MatrixEffectsIds]?: MatrixEffect } = {};
const RELIC_EFFECTS: { [key in RelicEffectsIds]?: RelicEffect } = {};
const TRAIT_EFFECTS: { [key in TraitEffectsIds]?: TraitEffect } = {};
const WEAPON_SETTINGS: { [key in WeaponSettingsIds]?: WeaponSetting } = {};
const WEAPONS: { [key in WeaponsIds]?: Weapon } = {};
const MATRIX: { [key in MatrixIds]?: Matrix } = {};
const RELIC: { [key in RelicsIds]?: Relic } = {};
const TRAIT: { [key in TraitsIds]?: Trait } = {};

export async function getResoEffects(reso: ResoEffectsIds): Promise<ResoEffect> {
	if (RESO_EFFECTS[reso]) {
		return RESO_EFFECTS[reso];
	}

	try {
		const response = await fetch(`./json/reso_effect/${reso}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load resonance effects for ${reso}: ${response.statusText}`);
		}

		const data = await response.json();
		RESO_EFFECTS[reso] = data as ResoEffect;
		return RESO_EFFECTS[reso];
	} catch (error) {
		console.error(`Error loading resonance effects for ${reso}:`, error);
		throw error;
	}
}

export async function getWeaponEffect(effect: WeaponEffectsIds): Promise<WeaponEffect> {
	if (WEAPON_EFFECTS[effect]) {
		return WEAPON_EFFECTS[effect];
	}

	try {
		const response = await fetch(`./json/weapon_effect/${effect}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load effect ${effect}: ${response.statusText}`);
		}

		const data = await response.json();
		WEAPON_EFFECTS[effect] = data as WeaponEffect;
		return WEAPON_EFFECTS[effect];
	} catch (error) {
		console.error(`Error loading effect ${effect}:`, error);
		throw error;
	}
}

export async function getMatrixEffect(effect: MatrixEffectsIds): Promise<MatrixEffect> {
	if (MATRIX_EFFECTS[effect]) {
		return MATRIX_EFFECTS[effect];
	}

	try {
		const response = await fetch(`./json/matrix_effect/${effect}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load effect ${effect}: ${response.statusText}`);
		}

		const data = await response.json();
		MATRIX_EFFECTS[effect] = data as MatrixEffect;
		return MATRIX_EFFECTS[effect];
	} catch (error) {
		console.error(`Error loading effect ${effect}:`, error);
		throw error;
	}
}

export async function getRelicEffect(effect: RelicEffectsIds): Promise<RelicEffect> {
	if (RELIC_EFFECTS[effect]) {
		return RELIC_EFFECTS[effect];
	}

	try {
		const response = await fetch(`./json/relic_effect/${effect}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load effect ${effect}: ${response.statusText}`);
		}

		const data = await response.json();
		RELIC_EFFECTS[effect] = data as RelicEffect;
		return RELIC_EFFECTS[effect];
	} catch (error) {
		console.error(`Error loading effect ${effect}:`, error);
		throw error;
	}
}

export async function getTraitEffect(effect: TraitEffectsIds): Promise<TraitEffect> {
	if (TRAIT_EFFECTS[effect]) {
		return TRAIT_EFFECTS[effect];
	}

	try {
		const response = await fetch(`./json/trait_effect/${effect}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load effect ${effect}: ${response.statusText}`);
		}

		const data = await response.json();
		TRAIT_EFFECTS[effect] = data as TraitEffect;
		return TRAIT_EFFECTS[effect];
	} catch (error) {
		console.error(`Error loading effect ${effect}:`, error);
		throw error;
	}
}

export async function getWeaponSetting(setting: WeaponSettingsIds): Promise<WeaponSetting> {
	if (WEAPON_SETTINGS[setting]) {
		return WEAPON_SETTINGS[setting];
	}

	try {
		const response = await fetch(`./json/weapon_setting/${setting}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load setting ${setting}: ${response.statusText}`);
		}

		const data = await response.json();
		WEAPON_SETTINGS[setting] = data as WeaponSetting;
		return WEAPON_SETTINGS[setting];
	} catch (error) {
		console.error(`Error loading setting ${setting}:`, error);
		throw error;
	}
}

export async function getWeapon(weapon: WeaponsIds): Promise<Weapon> {
	if (WEAPONS[weapon]) {
		return WEAPONS[weapon];
	}

	try {
		const response = await fetch(`./json/weapon/${weapon}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load weapon ${weapon}: ${response.statusText}`);
		}

		const data = await response.json();
		WEAPONS[weapon] = data as Weapon;
		return WEAPONS[weapon];
	} catch (error) {
		console.error(`Error loading weapon ${weapon}:`, error);
		return getWeapon('none');
	}
}

export async function getMatrix(matrix: MatrixIds): Promise<Matrix> {
	if (MATRIX[matrix]) {
		return MATRIX[matrix];
	}

	try {
		const response = await fetch(`./json/matrix/${matrix}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load matrix ${matrix}: ${response.statusText}`);
		}

		const data = await response.json();
		MATRIX[matrix] = data as Matrix;
		return MATRIX[matrix];
	} catch (error) {
		console.error(`Error loading matrix ${matrix}:`, error);
		return getMatrix('none');
	}
}

export async function getRelic(relic: RelicsIds): Promise<Relic> {
	if (RELIC[relic]) {
		return RELIC[relic];
	}

	try {
		const response = await fetch(`./json/relic/${relic}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load relic ${relic}: ${response.statusText}`);
		}

		const data = await response.json();
		RELIC[relic] = data as Relic;
		return RELIC[relic];
	} catch (error) {
		console.error(`Error loading relic ${relic}:`, error);
		return getRelic('none');
	}
}

export async function getTrait(trait: TraitsIds): Promise<Trait> {
	if (TRAIT[trait]) {
		return TRAIT[trait];
	}

	try {
		const response = await fetch(`./json/trait/${trait}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load trait ${trait}: ${response.statusText}`);
		}

		const data = await response.json();
		TRAIT[trait] = data as Trait;
		return TRAIT[trait];
	} catch (error) {
		console.error(`Error loading trait ${trait}:`, error);
		return getTrait('none');
	}
}
