import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const out_file_types = path.join(projectRoot, 'src/lib/generated/ids.d.ts');
const out_file_arrays = path.join(projectRoot, 'src/lib/generated/all-ids.ts');

const reso_effects_path = path.join(projectRoot, 'static/json/reso_effect');
const weapon_effects_path = path.join(projectRoot, 'static/json/weapon_effect');
const matrix_effects_path = path.join(projectRoot, 'static/json/matrix_effect');
const relic_effects_path = path.join(projectRoot, 'static/json/relic_effect');
const trait_effects_path = path.join(projectRoot, 'static/json/trait_effect');
const weapons_path = path.join(projectRoot, 'static/json/weapon');
const matrix_path = path.join(projectRoot, 'static/json/matrix');
const relics_path = path.join(projectRoot, 'static/json/relic');
const traits_path = path.join(projectRoot, 'static/json/trait');
const weapon_settings_path = path.join(projectRoot, 'static/json/weapon_setting');

const reso_effects_ids = fs
	.readdirSync(reso_effects_path)
	.filter((file) => file.endsWith('.json'))
	.map((file) => path.basename(file, '.json'));
const weapon_effects_ids = fs
	.readdirSync(weapon_effects_path)
	.filter((file) => file.endsWith('.json'))
	.map((file) => path.basename(file, '.json'));
const matrix_effects_ids = fs
	.readdirSync(matrix_effects_path)
	.filter((file) => file.endsWith('.json'))
	.map((file) => path.basename(file, '.json'));
const relic_effects_ids = fs
	.readdirSync(relic_effects_path)
	.filter((file) => file.endsWith('.json'))
	.map((file) => path.basename(file, '.json'));
const trait_effects_ids = fs
	.readdirSync(trait_effects_path)
	.filter((file) => file.endsWith('.json'))
	.map((file) => path.basename(file, '.json'));
const weapon_settings_ids = fs
	.readdirSync(weapon_settings_path)
	.filter((file) => file.endsWith('.json'))
	.map((file) => path.basename(file, '.json'));

const weapons_ids = [
	'none',
	...fs
		.readdirSync(weapons_path)
		.filter((file) => file.endsWith('.json') && file !== 'none.json')
		.map((file) => path.basename(file, '.json'))
];
const matrix_ids = [
	'none',
	...fs
		.readdirSync(matrix_path)
		.filter((file) => file.endsWith('.json') && file !== 'none.json')
		.map((file) => path.basename(file, '.json'))
];
const relic_ids = [
	'none',
	...fs
		.readdirSync(relics_path)
		.filter((file) => file.endsWith('.json') && file !== 'none.json')
		.map((file) => path.basename(file, '.json'))
];
const trait_ids = [
	'none',
	...fs
		.readdirSync(traits_path)
		.filter((file) => file.endsWith('.json') && file !== 'none.json')
		.map((file) => path.basename(file, '.json'))
];

const gear_effect_ids = [
	'gear-A',
	'gear-B',
	'gear-C',
	'gear-H',
	'gear-L',
	'gear-S',
	'gear-T',
	'gear-V',
	'gear-X',
	'gear-N',
	'gear-R',
	'gear-G'
];
const other_effect_ids = ['unaccounted', 'supercompute', 'enhanced-blade-shot'];
const weapon_base_effect_ids = weapons_ids.map((id) => `${id}-base`);

const typeDefs = `// Auto-generated file

export type WeaponEffectsIds = ${weapon_effects_ids.map((id) => `"${id}"`).join(' | ')};
export type MatrixEffectsIds = ${matrix_effects_ids.map((id) => `"${id}"`).join(' | ')};
export type ResoEffectsIds = ${reso_effects_ids.map((id) => `"${id}"`).join(' | ')};
export type RelicEffectsIds = ${relic_effects_ids.map((id) => `"${id}"`).join(' | ')};
export type TraitEffectsIds = ${trait_effects_ids.map((id) => `"${id}"`).join(' | ')};
export type WeaponSettingsIds = ${weapon_settings_ids.map((id) => `"${id}"`).join(' | ')};

export type WeaponsIds = ${weapons_ids.map((id) => `"${id}"`).join(' | ')};
export type MatrixIds = ${matrix_ids.map((id) => `"${id}"`).join(' | ')};
export type RelicsIds = ${relic_ids.map((id) => `"${id}"`).join(' | ')};
export type TraitsIds = ${trait_ids.map((id) => `"${id}"`).join(' | ')};

export type GearEffectsIds = ${gear_effect_ids.map((id) => `"${id}"`).join(' | ')};
export type OtherEffectIds = ${other_effect_ids.map((id) => `"${id}"`).join(' | ')};
export type WeaponBaseEffectIds = ${weapon_base_effect_ids.map((id) => `"${id}"`).join(' | ')};

`;

const arrayDefs = `// Auto-generated file

import type { 
		WeaponEffectsIds, 
		MatrixEffectsIds, 
		ResoEffectsIds, 
		RelicEffectsIds, 
		TraitEffectsIds,  
		WeaponSettingsIds,
		WeaponsIds, 
		MatrixIds, 
		RelicsIds, 
		TraitsIds, 
		GearEffectsIds,
		OtherEffectIds,
		WeaponBaseEffectIds
		 } from './ids';

export const AllWeaponEffectIds: WeaponEffectsIds[] = ${JSON.stringify(weapon_effects_ids)};
export const AllMatrixEffectIds: MatrixEffectsIds[] = ${JSON.stringify(matrix_effects_ids)};
export const AllResoEffectIds: ResoEffectsIds[] = ${JSON.stringify(reso_effects_ids)};
export const AllRelicEffectIds: RelicEffectsIds[] = ${JSON.stringify(relic_effects_ids)};
export const AllTraitEffectIds: TraitEffectsIds[] = ${JSON.stringify(trait_effects_ids)};
export const AllWeaponSettingsIds: WeaponSettingsIds[] = ${JSON.stringify(weapon_settings_ids)};

export const AllMatrixIds: MatrixIds[] = ${JSON.stringify(matrix_ids)};
export const AllWeaponIds: WeaponsIds[] = ${JSON.stringify(weapons_ids)};
export const AllRelicIds: RelicsIds[] = ${JSON.stringify(relic_ids)};
export const AllTraitIds: TraitsIds[] = ${JSON.stringify(trait_ids)};

export const AllGearEffectIds: GearEffectsIds[] = ${JSON.stringify(gear_effect_ids)};
export const AllOtherEffectIds: OtherEffectIds[] = ${JSON.stringify(other_effect_ids)};
export const AllWeaponBaseEffectIds: WeaponBaseEffectIds[] = ${JSON.stringify(weapon_base_effect_ids)};

`;

fs.writeFileSync(out_file_types, typeDefs);
fs.writeFileSync(out_file_arrays, arrayDefs);

console.log('✅ Id types generated successfully.');
