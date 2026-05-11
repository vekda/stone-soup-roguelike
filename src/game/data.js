export const TILE_SIZE = 32;
export const MAP_WIDTH = 36;
export const MAP_HEIGHT = 24;
export const MAX_LOG = 8;

export const TILES = {
  wall: '#',
  floor: '.',
  stairs: '>',
};

export const CLASSES = {
  fighter: {
    id: 'fighter',
    name: '铁锅战士',
    hp: 28,
    attack: 7,
    defense: 2,
    sprite: 'hero_fighter',
    desc: '抗打、稳定，适合第一次下地牢。',
    skill: { id: 'shield_bash', name: '锅盖猛击', cooldown: 4, desc: '重击相邻敌人，并获得 2 回合减伤。' },
  },
  mage: {
    id: 'mage',
    name: '香料法师',
    hp: 20,
    attack: 9,
    defense: 0,
    sprite: 'hero_mage',
    desc: '伤害高但脆弱。',
    skill: { id: 'spice_burst', name: '辣雾爆燃', cooldown: 5, desc: '灼烧距离 5 内所有敌人。' },
  },
  rogue: {
    id: 'rogue',
    name: '菜刀游侠',
    hp: 23,
    attack: 6,
    defense: 1,
    sprite: 'hero_rogue',
    desc: '更容易暴击，行动灵活。',
    skill: { id: 'shadow_stab', name: '影步背刺', cooldown: 4, desc: '闪到近处敌人旁并发动强力背刺。' },
  },
  healer: {
    id: 'healer',
    name: '汤药医师',
    hp: 24,
    attack: 5,
    defense: 1,
    sprite: 'hero_healer',
    desc: '攻击偏低，但能用药汤续航。',
    skill: { id: 'brew_broth', name: '急煮药汤', cooldown: 6, desc: '回复生命；满血时获得临时防御。' },
  },
  summoner: {
    id: 'summoner',
    name: '酵母召唤师',
    hp: 19,
    attack: 5,
    defense: 0,
    sprite: 'hero_summoner',
    desc: '本体脆弱，依靠面团伙伴挡刀控场。',
    skill: { id: 'raise_dough', name: '发酵面团', cooldown: 7, desc: '在身边召唤一个会吸引敌人的面团伙伴。' },
  },
};

export const ENEMY_TYPES = [
  { id: 'rat', name: '地牢鼠', hp: 8, attack: 3, defense: 0, xp: 3, sprite: 'enemy_rat', depth: 1 },
  { id: 'goblin', name: '盐沼哥布林', hp: 13, attack: 5, defense: 1, xp: 6, sprite: 'enemy_goblin', depth: 1 },
  { id: 'orc', name: '熏肉兽人', hp: 19, attack: 7, defense: 2, xp: 10, sprite: 'enemy_orc', depth: 2 },
  { id: 'troll', name: '汤锅巨魔', hp: 28, attack: 9, defense: 3, xp: 16, sprite: 'enemy_troll', depth: 3 },
  { id: 'dragon', name: '石汤古龙', hp: 45, attack: 12, defense: 4, xp: 50, sprite: 'enemy_dragon', depth: 4 },
];

export const ITEM_TYPES = [
  { id: 'potion', name: '红汤药水', kind: 'heal', amount: 12, sprite: 'item_potion', desc: '回复 12 点生命。' },
  { id: 'bread', name: '硬面包', kind: 'heal', amount: 6, sprite: 'item_bread', desc: '回复 6 点生命。' },
  { id: 'sword', name: '铁菜刀', kind: 'weapon', attack: 2, sprite: 'item_sword', desc: '永久攻击 +2。' },
  { id: 'armor', name: '锅盖甲', kind: 'armor', defense: 1, sprite: 'item_armor', desc: '永久防御 +1。' },
  { id: 'scroll', name: '火焰卷轴', kind: 'scroll', damage: 10, sprite: 'item_scroll', desc: '灼烧视野内所有敌人。' },
];
