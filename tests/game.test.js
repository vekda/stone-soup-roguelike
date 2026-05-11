import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGame, movePlayer, useItem, useSkill, waitTurn } from '../src/game/engine.js';
import { isWalkable } from '../src/game/map.js';
import { CLASSES, ENEMY_TYPES, ITEM_TYPES } from '../src/game/data.js';

test('new game places player on a walkable tile and spawns content with sprites', () => {
  const state = newGame('fighter', 1234);
  assert.equal(state.status, 'playing');
  assert.equal(isWalkable(state.map, state.player.x, state.player.y), true);
  assert.ok(state.enemies.length > 0);
  assert.ok(state.items.length > 0);
  assert.ok(state.enemies.every((e) => e.sprite));
  assert.ok(state.items.every((i) => i.sprite));
});

test('all classes enemies and items declare sprite ids', () => {
  for (const cls of Object.values(CLASSES)) assert.ok(cls.sprite, cls.name);
  for (const enemy of ENEMY_TYPES) assert.ok(enemy.sprite, enemy.name);
  for (const item of ITEM_TYPES) assert.ok(item.sprite, item.name);
});

test('five classes exist and every class declares a distinctive skill', () => {
  assert.deepEqual(Object.keys(CLASSES).sort(), ['fighter', 'healer', 'mage', 'rogue', 'summoner']);
  const skillIds = new Set();
  for (const cls of Object.values(CLASSES)) {
    assert.ok(cls.skill?.id, `${cls.name} should have skill id`);
    assert.ok(cls.skill?.name, `${cls.name} should have skill name`);
    assert.ok(cls.skill?.desc, `${cls.name} should have skill desc`);
    assert.ok(cls.skill?.cooldown > 0, `${cls.name} should have cooldown`);
    skillIds.add(cls.skill.id);
  }
  assert.equal(skillIds.size, 5);
});

test('new healer and summoner initialize with their own stats sprites and skills', () => {
  const healer = newGame('healer', 100);
  assert.equal(healer.player.classId, 'healer');
  assert.equal(healer.player.sprite, 'hero_healer');
  assert.equal(healer.player.skill.id, 'brew_broth');
  const summoner = newGame('summoner', 101);
  assert.equal(summoner.player.classId, 'summoner');
  assert.equal(summoner.player.sprite, 'hero_summoner');
  assert.equal(summoner.player.skill.id, 'raise_dough');
  assert.ok(Array.isArray(summoner.summons));
});

test('using healing item cannot exceed max hp', () => {
  const state = newGame('fighter', 44);
  state.player.hp = 3;
  state.enemies = [];
  state.player.inventory = [{ id: 'potion', name: '红汤药水', kind: 'heal', amount: 999, sprite: 'item_potion' }];
  useItem(state, 0);
  assert.equal(state.player.hp, state.player.maxHp);
  assert.equal(state.player.inventory.length, 0);
});

test('moving into adjacent enemy attacks it', () => {
  const state = newGame('fighter', 55);
  state.enemies = [{ id: 'rat', name: '测试鼠', hp: 8, maxHp: 8, attack: 0, defense: 0, xp: 1, sprite: 'enemy_rat', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  movePlayer(state, 1, 0);
  assert.ok(state.enemies.length === 0 || state.enemies[0].hp < 8);
});

test('fighter skill damages adjacent enemy and starts cooldown', () => {
  const state = newGame('fighter', 200);
  state.enemies = [{ id: 'rat', name: '测试鼠', hp: 30, maxHp: 30, attack: 0, defense: 0, xp: 1, sprite: 'enemy_rat', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  useSkill(state);
  assert.ok(state.enemies[0].hp < 30);
  assert.ok(state.player.skill.remaining > 0);
  assert.ok(state.player.effects.some((e) => e.id === 'guard'));
});

test('healer skill restores hp without exceeding max hp', () => {
  const state = newGame('healer', 201);
  state.enemies = [];
  state.player.hp = state.player.maxHp - 2;
  useSkill(state);
  assert.equal(state.player.hp, state.player.maxHp);
  assert.ok(state.player.skill.remaining > 0);
});

test('summoner skill creates a dough summon with sprite', () => {
  const state = newGame('summoner', 202);
  state.enemies = [];
  useSkill(state);
  assert.equal(state.summons.length, 1);
  assert.equal(state.summons[0].sprite, 'summon_dough');
  assert.ok(isWalkable(state.map, state.summons[0].x, state.summons[0].y));
});

test('player can swap places with own summon instead of being blocked in corridors', () => {
  const state = newGame('summoner', 303);
  state.enemies = [];
  state.items = [];
  const px = state.player.x;
  const py = state.player.y;
  state.summons = [{ id: 'dough-test', name: '面团伙伴', hp: 10, maxHp: 10, attack: 2, defense: 0, sprite: 'summon_dough', x: px + 1, y: py }];
  movePlayer(state, 1, 0);
  assert.equal(state.player.x, px + 1);
  assert.equal(state.player.y, py);
  assert.equal(state.summons[0].x, px);
  assert.equal(state.summons[0].y, py);
});

test('wait turn lets enemies act and reduces skill cooldown', () => {
  const state = newGame('fighter', 304);
  state.enemies = [{ id: 'rat', name: '测试鼠', hp: 8, maxHp: 8, attack: 3, defense: 0, xp: 1, sprite: 'enemy_rat', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  state.player.skill.remaining = 2;
  const beforeHp = state.player.hp;
  waitTurn(state);
  assert.ok(state.player.hp < beforeHp);
  assert.equal(state.player.skill.remaining, 1);
});

test('dough summon attacks adjacent enemies using summoner attack value', () => {
  const state = newGame('summoner', 305);
  state.player.attack = 9;
  state.enemies = [{ id: 'rat', name: '测试鼠', hp: 30, maxHp: 30, attack: 0, defense: 0, xp: 1, sprite: 'enemy_rat', x: state.player.x + 2, y: state.player.y }];
  state.summons = [{ id: 'dough-test', name: '面团伙伴', hp: 10, maxHp: 10, attack: 2, defense: 0, sprite: 'summon_dough', x: state.player.x + 1, y: state.player.y }];
  waitTurn(state);
  assert.equal(state.enemies[0].hp, 21);
});

test('using item is instant and does not trigger enemy turn or cooldown tick', () => {
  const state = newGame('fighter', 306);
  state.enemies = [{ id: 'rat', name: '测试鼠', hp: 8, maxHp: 8, attack: 3, defense: 0, xp: 1, sprite: 'enemy_rat', x: state.player.x + 1, y: state.player.y }];
  state.player.hp = 5;
  state.player.skill.remaining = 2;
  state.player.inventory = [{ id: 'potion', name: '红汤药水', kind: 'heal', amount: 12, sprite: 'item_potion' }];
  useItem(state, 0);
  assert.equal(state.player.hp, 17);
  assert.equal(state.player.skill.remaining, 2);
});

test('R key returns to class select menu instead of immediately rerolling current dungeon', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const\s+returnToMenu\s*=\s*\(\)\s*=>\s*\{/);
  assert.match(source, /setStarted\(false\)/);
  assert.doesNotMatch(source, /k\s*===\s*['"]r['"]\)\s*restart\(classId\)/);
  assert.match(source, /k\s*===\s*['"]r['"]\)\s*returnToMenu\(\)/);
});
