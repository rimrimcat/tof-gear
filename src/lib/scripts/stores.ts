import type { Snippet } from 'svelte';
import { writable } from 'svelte/store';
import type {
	AllLoadouts,
	CharacterStat,
	GearView,
	MatrixView,
	ResoEffect,
	ResoTriggerCounts,
	UserGear,
	Weapon,
	WeaponView
} from '../types/index';
import { StatCollection } from './stats';

export const scroll_y = writable<number>(0);
export const is_mobile = writable<boolean>(false);
export const font_size = writable<number>(16);
export const inner_width = writable<number>(1000);
export const toolbar_transform = writable<number>(0);

// interactive guide
export const guide_open = writable<boolean>(false);
export const guide_content = writable<(Snippet | string)[] | null>(null);

// user data
export const user_gears = writable<UserGear[]>([]);
export const user_loadouts = writable<AllLoadouts>({});

// temp data
export const current_loadout = writable<string>('');

// gear
export const gear_views = writable<GearView[]>([]);
export const equipped_gear_views = writable<GearView[]>([]);

// loadout
export const base_weapons = writable<Weapon[]>([]);
export const reso_counts = writable<ResoTriggerCounts>({});
export const reso_effects = writable<ResoEffect[]>([]);
export const reso_stat = writable<StatCollection>(new StatCollection());
export const weapon_views = writable<WeaponView[]>([]);
export const matrix_views = writable<MatrixView[]>([]);

// overall
export const all_stats = writable<StatCollection>(new StatCollection());

// overall stat
export const stat_view = writable<CharacterStat[]>([]);
