import fs from 'fs';
import path from 'path';
import * as TJS from 'typescript-json-schema';

const projectRoot = process.cwd();

const settings: TJS.PartialArgs = {
	required: true,
	noExtraProps: true
};

const inputTypes = path.join(projectRoot, 'src/lib/scripts/json-types.ts');
const schemaDir = path.join(projectRoot, 'src/lib/schemas');

if (!fs.existsSync(schemaDir)) {
	fs.mkdirSync(schemaDir, { recursive: true });
}

const program = TJS.getProgramFromFiles([inputTypes], {
	strictNullChecks: true
});

const schema_reso_effects = TJS.generateSchema(program, 'ResoEffects', settings);
const schema_weapon_effects = TJS.generateSchema(program, 'WeaponEffects', settings);
const schema_matrix_effects = TJS.generateSchema(program, 'MatrixEffects', settings);
const schema_weapons = TJS.generateSchema(program, 'Weapons', settings);
const schema_matrix = TJS.generateSchema(program, 'Matrices', settings);

fs.writeFileSync(
	path.join(schemaDir, 'reso_effect.schema.json'),
	JSON.stringify(schema_reso_effects, null, 2)
);
fs.writeFileSync(
	path.join(schemaDir, 'weapon_effect.schema.json'),
	JSON.stringify(schema_weapon_effects, null, 2)
);
fs.writeFileSync(
	path.join(schemaDir, 'matrix_effect.schema.json'),
	JSON.stringify(schema_matrix_effects, null, 2)
);
fs.writeFileSync(
	path.join(schemaDir, 'weapon.schema.json'),
	JSON.stringify(schema_weapons, null, 2)
);
fs.writeFileSync(
	path.join(schemaDir, 'matrix.schema.json'),
	JSON.stringify(schema_matrix, null, 2)
);

console.log('✅ JSON schemas generated successfully.');
