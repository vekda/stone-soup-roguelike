import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/assets');
fs.mkdirSync(outDir, { recursive: true });

const P = {
  transparent: 'none', black: '#151018', outline: '#2b1d22', white: '#f7ead7', wall1: '#4a3b36', wall2: '#6b5a50', floor1: '#2c2b2f', floor2: '#39373a', gold: '#ffd37a', red: '#d94b4b', green: '#55b867', blue: '#5aa9e6', purple: '#a56de2', orange: '#e88f3a', brown: '#8b5a3c', grey: '#a9a9a9', dark: '#20202a', mint: '#8ee6b8', cream: '#f3d6a2', pink: '#e98ac0'
};

const sprites = {
  tile_floor: { bg: P.floor1, pixels: [[2,2,5,1,P.floor2],[14,7,6,1,P.floor2],[5,18,8,1,P.floor2],[24,25,4,1,P.floor2]] },
  tile_wall: { bg: P.wall1, pixels: [[0,7,32,2,P.outline],[0,16,32,2,P.outline],[8,0,2,8,P.outline],[20,8,2,8,P.outline],[12,18,2,14,P.outline],[2,2,5,3,P.wall2],[23,11,6,3,P.wall2],[5,22,5,3,P.wall2]] },
  tile_stairs: { bg: P.floor1, pixels: [[5,23,22,4,P.wall2],[9,18,18,4,P.wall2],[13,13,14,4,P.wall2],[17,8,10,4,P.wall2],[21,4,6,3,P.gold]] },
  hero_fighter: { bg: 'none', pixels: [[8,6,16,4,P.grey],[10,10,12,6,P.white],[7,16,18,10,P.blue],[5,18,3,10,P.grey],[24,17,3,12,P.grey],[11,26,4,5,P.brown],[18,26,4,5,P.brown]] },
  hero_mage: { bg: 'none', pixels: [[9,3,14,6,P.purple],[7,9,18,5,P.purple],[11,12,10,5,P.white],[8,17,16,12,P.purple],[5,21,4,8,P.blue],[23,21,4,8,P.blue],[14,25,4,5,P.gold]] },
  hero_rogue: { bg: 'none', pixels: [[10,6,12,5,P.green],[8,11,16,5,P.dark],[11,13,10,5,P.white],[8,18,16,10,P.green],[4,18,5,3,P.grey],[23,18,5,3,P.grey],[11,27,4,4,P.brown],[18,27,4,4,P.brown]] },
  hero_healer: { bg: 'none', pixels: [[10,5,12,5,P.white],[8,10,16,5,P.mint],[11,12,10,5,P.white],[7,17,18,11,P.white],[10,19,4,7,P.red],[6,21,4,8,P.mint],[23,21,4,8,P.mint],[12,28,4,3,P.brown],[18,28,4,3,P.brown],[20,6,5,5,P.red]] },
  hero_summoner: { bg: 'none', pixels: [[8,5,16,6,P.cream],[9,10,14,5,P.pink],[11,12,10,5,P.white],[7,17,18,11,P.brown],[4,20,5,8,P.cream],[23,20,5,8,P.cream],[11,28,4,3,P.dark],[18,28,4,3,P.dark],[14,3,5,4,P.mint],[20,3,4,3,P.mint]] },
  enemy_rat: { bg: 'none', pixels: [[6,17,20,8,P.brown],[3,15,6,6,P.brown],[24,14,4,4,P.brown],[9,19,3,3,P.black],[4,12,2,3,P.red],[27,20,4,2,P.grey],[10,25,3,3,P.outline],[20,25,3,3,P.outline]] },
  enemy_goblin: { bg: 'none', pixels: [[8,8,16,11,P.green],[5,11,5,5,P.green],[23,11,5,5,P.green],[11,12,3,3,P.black],[19,12,3,3,P.black],[10,20,12,8,P.brown],[7,18,4,9,P.green],[22,18,4,9,P.green],[12,28,4,3,P.outline],[18,28,4,3,P.outline]] },
  enemy_orc: { bg: 'none', pixels: [[7,7,18,13,'#6aa84f'],[4,12,5,6,'#6aa84f'],[24,12,5,6,'#6aa84f'],[11,12,3,3,P.black],[20,12,3,3,P.black],[8,21,17,8,P.grey],[3,19,5,10,P.brown],[25,19,4,10,P.brown],[11,29,4,3,P.outline],[20,29,4,3,P.outline]] },
  enemy_troll: { bg: 'none', pixels: [[5,6,22,17,'#70885b'],[8,3,5,5,'#70885b'],[20,3,5,5,'#70885b'],[10,12,4,4,P.black],[19,12,4,4,P.black],[8,22,18,7,P.brown],[2,17,5,12,'#70885b'],[27,17,4,12,'#70885b'],[9,29,5,3,P.outline],[20,29,5,3,P.outline]] },
  enemy_dragon: { bg: 'none', pixels: [[6,11,20,10,P.red],[3,8,8,8,P.red],[22,7,6,5,P.orange],[10,4,4,7,P.red],[16,4,4,7,P.red],[6,20,16,6,P.red],[23,18,6,3,P.red],[8,26,4,5,P.outline],[19,26,4,5,P.outline],[5,11,2,2,P.gold],[2,5,4,3,P.gold]] },
  summon_dough: { bg: 'none', pixels: [[7,13,18,12,P.cream],[5,16,22,8,P.cream],[9,10,14,6,'#ffe8bd'],[11,17,3,3,P.black],[19,17,3,3,P.black],[14,22,6,2,P.brown],[8,25,4,3,P.outline],[21,25,4,3,P.outline]] },
  item_potion: { bg: 'none', pixels: [[13,5,6,5,P.grey],[10,10,12,3,P.white],[9,13,14,15,P.red],[11,16,10,8,'#ff7777'],[12,28,8,2,P.outline]] },
  item_bread: { bg: 'none', pixels: [[7,14,18,11,'#c9823b'],[9,10,14,7,'#e3a857'],[10,13,3,2,P.white],[16,12,3,2,P.white],[21,14,2,2,P.white]] },
  item_sword: { bg: 'none', pixels: [[15,3,3,18,P.grey],[13,20,7,3,P.gold],[14,23,5,6,P.brown],[13,29,7,2,P.outline],[18,5,2,12,P.white]] },
  item_armor: { bg: 'none', pixels: [[8,7,16,5,P.grey],[6,12,20,14,P.grey],[10,15,12,11,'#7f8a99'],[8,26,16,3,P.outline],[13,9,6,18,P.white]] },
  item_scroll: { bg: 'none', pixels: [[8,7,16,19,P.white],[6,9,4,4,P.gold],[22,21,4,4,P.gold],[11,12,10,2,P.red],[11,17,9,2,P.red],[11,22,8,2,P.red]] }
};

function svgFor(def) {
  const bg = def.bg && def.bg !== 'none' ? `<rect width="32" height="32" fill="${def.bg}"/>` : '';
  const px = def.pixels.map(([x,y,w,h,c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">${bg}${px}</svg>`;
}
for (const [name, def] of Object.entries(sprites)) fs.writeFileSync(path.join(outDir, `${name}.svg`), svgFor(def));
const module = `export const sprites = ${JSON.stringify(Object.fromEntries(Object.keys(sprites).map((k) => [k, `/assets/${k}.svg`])), null, 2)};\n`;
fs.mkdirSync(path.resolve('src'), { recursive: true });
fs.writeFileSync(path.resolve('src/sprites.js'), module);
console.log(`generated ${Object.keys(sprites).length} sprites`);
