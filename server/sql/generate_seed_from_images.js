import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const imgDir = path.join(root, 'frontend/public/pictures/electricComponents');
const exportPath = path.join(root, 'electric_components_export.json');
const outPath = path.join(__dirname, 'seed_from_images.sql');

const files = fs
  .readdirSync(imgDir)
  .filter((f) => /\.(jpg|jpeg)$/i.test(f) && !f.startsWith('temp_'));

const extById = Object.fromEntries(
  files.map((f) => {
    const m = f.match(/^(.+)\.(jpg|jpeg)$/i);
    return [m[1], m[2].toLowerCase() === 'jpeg' ? 'jpeg' : 'jpg'];
  })
);

const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

const esc = (s) => {
  if (s == null) return 'NULL';
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
};

const rows = data
  .filter((c) => extById[c.id])
  .map((c) => {
    const img = `/pictures/electricComponents/${c.id}.${extById[c.id]}`;
    return `(${[
      esc(c.id),
      esc(c.name),
      Number(c.fields) || 0,
      esc(c.description),
      Number(c.price).toFixed(2),
      esc(img),
      esc(c.category || null),
      c.subcategory == null || c.subcategory === '' ? 'NULL' : esc(c.subcategory),
    ].join(', ')})`;
  });

const sql = `-- Seed dopasowany do lokalnych JPG w frontend/public/pictures/electricComponents
-- Pomija pliki temp_*
-- Wygenerowano automatycznie — uruchom w phpMyAdmin na bazie lxsxnvawhg_volt

USE \`lxsxnvawhg_volt\`;

-- fuse_types (bez zdjęć; standardowy seed)
INSERT INTO \`fuse_types\` (\`fuse_type\`, \`phase_type\`) VALUES
  ('6A', '1φ'), ('10A', '1φ'), ('13A', '1φ'), ('16A', '1φ'),
  ('20A', '1φ'), ('25A', '1φ'), ('32A', '1φ'), ('40A', '1φ'),
  ('50A', '1φ'), ('63A', '1φ'),
  ('16A', '3φ'), ('20A', '3φ'), ('25A', '3φ'), ('32A', '3φ'),
  ('40A', '3φ'), ('50A', '3φ'), ('63A', '3φ'), ('80A', '3φ'),
  ('100A', '3φ'), ('125A', '3φ')
ON DUPLICATE KEY UPDATE \`fuse_type\` = VALUES(\`fuse_type\`);

-- electric_components: ${rows.length} pozycji ze zdjęciami
INSERT INTO \`electric_components\`
  (\`id\`, \`name\`, \`fields\`, \`description\`, \`price\`, \`image\`, \`category\`, \`subcategory\`)
VALUES
${rows.join(',\n')}
ON DUPLICATE KEY UPDATE
  \`name\` = VALUES(\`name\`),
  \`fields\` = VALUES(\`fields\`),
  \`description\` = VALUES(\`description\`),
  \`price\` = VALUES(\`price\`),
  \`image\` = VALUES(\`image\`),
  \`category\` = VALUES(\`category\`),
  \`subcategory\` = VALUES(\`subcategory\`);
`;

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${rows.length} components → ${outPath}`);
