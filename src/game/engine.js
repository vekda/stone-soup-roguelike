import { CLASSES, ENEMY_TYPES, ITEM_TYPES, MAX_LOG, TILES } from './data.js';
import { makeMap, isWalkable, randomFloor } from './map.js';
import { distance, key, RNG } from './utils.js';

export function newGame(classId = 'fighter', seed = Date.now()) {
  const rng = new RNG(seed);
  const cls = CLASSES[classId] ?? CLASSES.fighter;
  const state = {
    rng,
    seed,
    status: 'playing',
    depth: 1,
    player: {
      x: 0,
      y: 0,
      classId: cls.id,
      name: cls.name,
      sprite: cls.sprite,
      maxHp: cls.hp,
      hp: cls.hp,
      attack: cls.attack,
      defense: cls.defense,
      xp: 0,
      level: 1,
      inventory: [],
      skill: { ...cls.skill, remaining: 0 },
      effects: [],
    },
    map: null,
    enemies: [],
    items: [],
    summons: [],
    log: [],
  };
  enterDepth(state, 1);
  addLog(state, `你作为${cls.name}进入了石汤地牢。`);
  return state;
}

export function enterDepth(state, depth) {
  state.depth = depth;
  state.map = makeMap(state.rng, depth);
  state.player.x = state.map.start.x;
  state.player.y = state.map.start.y;
  state.enemies = [];
  state.items = [];
  state.summons = [];
  populate(state);
}

function populate(state) {
  const occupied = new Set([key(state.player.x, state.player.y)]);
  const enemyCount = 6 + state.depth * 2;
  for (let i = 0; i < enemyCount; i++) {
    const options = ENEMY_TYPES.filter((e) => e.depth <= state.depth + 1);
    const base = state.rng.pick(options);
    const pos = randomFloor(state.map, state.rng, occupied);
    occupied.add(key(pos.x, pos.y));
    state.enemies.push({ ...base, x: pos.x, y: pos.y, hp: base.hp + state.depth * 2, maxHp: base.hp + state.depth * 2 });
  }
  const itemCount = 5 + Math.floor(state.depth / 2);
  for (let i = 0; i < itemCount; i++) {
    const base = state.rng.pick(ITEM_TYPES);
    const pos = randomFloor(state.map, state.rng, occupied);
    occupied.add(key(pos.x, pos.y));
    state.items.push({ ...base, x: pos.x, y: pos.y, uid: `${base.id}-${state.depth}-${i}-${state.rng.int(1, 9999)}` });
  }
}

export function movePlayer(state, dx, dy) {
  if (state.status !== 'playing') return state;
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  const enemy = state.enemies.find((e) => e.x === nx && e.y === ny);
  const summon = state.summons.find((s) => s.x === nx && s.y === ny);
  if (enemy) {
    attack(state, state.player, enemy);
    if (enemy.hp <= 0) killEnemy(state, enemy);
  } else if (summon) {
    summon.x = state.player.x;
    summon.y = state.player.y;
    state.player.x = nx;
    state.player.y = ny;
    addLog(state, `你和${summon.name}交换了位置。`);
  } else if (isWalkable(state.map, nx, ny)) {
    state.player.x = nx;
    state.player.y = ny;
    pickUpAtPlayer(state);
    if (state.map.tiles[ny][nx] === TILES.stairs) {
      enterDepth(state, state.depth + 1);
      addLog(state, `你沿楼梯来到第 ${state.depth} 层。`);
      return state;
    }
  } else {
    addLog(state, '你撞上了冰冷的石墙。');
    return state;
  }
  finishPlayerTurn(state);
  return state;
}

function attack(state, attacker, defender) {
  const crit = attacker.classId === 'rogue' && state.rng.next() < 0.22;
  const raw = attacker.attack + state.rng.int(0, 3) + (crit ? 5 : 0);
  const reduction = defender === state.player ? activeDamageReduction(state.player) : 0;
  const dmg = Math.max(1, raw - (defender.defense ?? 0) - reduction);
  defender.hp -= dmg;
  addLog(state, `${attacker.name ?? '怪物'}攻击${defender.name}造成 ${dmg} 点伤害${crit ? '（暴击）' : ''}。`);
}

function activeDamageReduction(player) {
  return player.effects.reduce((sum, e) => sum + (e.damageReduction ?? 0), 0);
}

function temporaryDefense(player) {
  return player.effects.reduce((sum, e) => sum + (e.defenseBonus ?? 0), 0);
}

function killEnemy(state, enemy) {
  state.enemies = state.enemies.filter((e) => e !== enemy);
  if (enemy.ability === 'deathBurst') {
    const dmg = enemy.burstDamage ?? 4;
    if (distance(enemy, state.player) <= 1) {
      state.player.hp -= Math.max(1, dmg - activeDamageReduction(state.player));
      addLog(state, `${enemy.name}爆裂，热气伤到你。`);
    }
    for (const summon of state.summons) {
      if (distance(enemy, summon) <= 1) summon.hp -= dmg;
    }
  }
  state.player.xp += enemy.xp;
  addLog(state, `${enemy.name}倒下了。获得 ${enemy.xp} 经验。`);
  const need = state.player.level * 18;
  if (state.player.xp >= need) {
    state.player.xp -= need;
    state.player.level += 1;
    state.player.maxHp += 5;
    state.player.hp = state.player.maxHp;
    state.player.attack += 1;
    addLog(state, `升级！你达到 ${state.player.level} 级，生命回满。`);
  }
  if (enemy.id === 'dragon' && state.depth >= 4) {
    state.status = 'won';
    addLog(state, '石汤古龙被击败，地牢传说属于你！');
  }
}

function pickUpAtPlayer(state) {
  const idx = state.items.findIndex((i) => i.x === state.player.x && i.y === state.player.y);
  if (idx >= 0) {
    const [item] = state.items.splice(idx, 1);
    if (state.player.inventory.length < 8) {
      state.player.inventory.push(item);
      addLog(state, `捡起：${item.name}。`);
    } else {
      addLog(state, '背包满了，物品留在原地。');
      state.items.push(item);
    }
  }
}

export function useItem(state, index) {
  if (state.status !== 'playing') return state;
  const item = state.player.inventory[index];
  if (!item) return state;
  state.player.inventory.splice(index, 1);
  if (item.kind === 'heal') {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.amount);
    addLog(state, `使用${item.name}，回复 ${item.amount} 点生命。`);
  } else if (item.kind === 'weapon') {
    state.player.attack += item.attack;
    addLog(state, `装备${item.name}，攻击 +${item.attack}。`);
  } else if (item.kind === 'armor') {
    state.player.defense += item.defense;
    addLog(state, `装备${item.name}，防御 +${item.defense}。`);
  } else if (item.kind === 'scroll') {
    const targets = state.enemies.filter((e) => distance(e, state.player) <= 8);
    targets.forEach((e) => { e.hp -= item.damage; });
    addLog(state, `${item.name}爆燃，${targets.length} 个敌人受到 ${item.damage} 点伤害。`);
    [...targets].forEach((e) => { if (e.hp <= 0) killEnemy(state, e); });
  } else if (item.kind === 'blast') {
    const targets = state.enemies.filter((e) => distance(e, state.player) <= (item.radius ?? 1));
    targets.forEach((e) => { e.hp -= item.damage; });
    addLog(state, `${item.name}泼洒开来，${targets.length} 个敌人受到 ${item.damage} 点伤害。`);
    [...targets].forEach((e) => { if (e.hp <= 0) killEnemy(state, e); });
  } else if (item.kind === 'guard') {
    state.player.effects = state.player.effects.filter((e) => e.id !== item.id);
    state.player.effects.push({ id: item.id, name: item.name, turns: item.turns ?? 3, defenseBonus: item.defenseBonus ?? 1 });
    addLog(state, `${item.name}让你暂时稳住阵脚。`);
  } else if (item.kind === 'summon') {
    const spot = adjacentOpenSquares(state, state.player)[0];
    if (spot) {
      state.summons.push({ id: `powder-dough-${Date.now()}-${state.rng.int(1, 9999)}`, name: '临时面团', hp: 8 + state.player.level, maxHp: 8 + state.player.level, attack: Math.max(1, state.player.attack - 1), defense: 0, sprite: 'summon_dough', x: spot.x, y: spot.y, temporary: true });
      addLog(state, `${item.name}鼓成一个临时面团。`);
    } else {
      addLog(state, `${item.name}没有找到发酵空间。`);
    }
  } else if (item.kind === 'cleanse') {
    state.player.effects = state.player.effects.filter((e) => e.id === 'guard' || e.defenseBonus);
    addLog(state, `${item.name}净化了身上的异味。`);
  } else if (item.kind === 'heal_guard') {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.amount);
    state.player.effects.push({ id: item.id, name: item.name, turns: item.turns ?? 2, defenseBonus: item.defenseBonus ?? 1 });
    addLog(state, `${item.name}又暖又稠，回复生命并增加防御。`);
  }
  removeDeadSummons(state);
  checkGameOver(state);
  return state;
}

export function useSkill(state) {
  if (state.status !== 'playing') return state;
  const skill = state.player.skill;
  if (!skill || skill.remaining > 0) {
    addLog(state, skill ? `${skill.name}还需要 ${skill.remaining} 回合冷却。` : '你没有技能。');
    return state;
  }
  let used = false;
  if (skill.id === 'shield_bash') used = shieldBash(state);
  else if (skill.id === 'spice_burst') used = spiceBurst(state);
  else if (skill.id === 'shadow_stab') used = shadowStab(state);
  else if (skill.id === 'brew_broth') used = brewBroth(state);
  else if (skill.id === 'raise_dough') used = raiseDough(state);
  if (!used) return state;
  skill.remaining = skill.cooldown;
  finishPlayerTurn(state);
  return state;
}

function shieldBash(state) {
  const target = nearestEnemy(state, 1);
  if (!target) { addLog(state, '锅盖猛击需要相邻敌人。'); return false; }
  target.hp -= state.player.attack + state.player.defense + temporaryDefense(state.player) + 4;
  state.player.effects = state.player.effects.filter((e) => e.id !== 'guard');
  state.player.effects.push({ id: 'guard', name: '防守', turns: 2, damageReduction: 2 });
  addLog(state, `锅盖猛击砸向${target.name}，并架起防守。`);
  if (target.hp <= 0) killEnemy(state, target);
  return true;
}

function spiceBurst(state) {
  const targets = state.enemies.filter((e) => distance(e, state.player) <= 5);
  if (targets.length === 0) { addLog(state, '辣雾爆燃没有命中目标。'); return false; }
  targets.forEach((e) => { e.hp -= 8; });
  addLog(state, `辣雾爆燃席卷 ${targets.length} 个敌人。`);
  [...targets].forEach((e) => { if (e.hp <= 0) killEnemy(state, e); });
  return true;
}

function shadowStab(state) {
  const target = nearestEnemy(state, 6);
  if (!target) { addLog(state, '影步背刺找不到近处敌人。'); return false; }
  const spot = adjacentOpenSquares(state, target).sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
  if (!spot) { addLog(state, '没有位置可供影步落脚。'); return false; }
  state.player.x = spot.x;
  state.player.y = spot.y;
  target.hp -= state.player.attack + 6;
  addLog(state, `你影步到${target.name}身旁完成背刺。`);
  if (target.hp <= 0) killEnemy(state, target);
  return true;
}

function brewBroth(state) {
  if (state.player.hp < state.player.maxHp) {
    const amount = Math.min(10, state.player.maxHp - state.player.hp);
    state.player.hp += amount;
    addLog(state, `急煮药汤温暖全身，回复 ${amount} 点生命。`);
  } else {
    state.player.effects = state.player.effects.filter((e) => e.id !== 'broth_armor');
    state.player.effects.push({ id: 'broth_armor', name: '药汤护体', turns: 3, defenseBonus: 1 });
    addLog(state, '药汤化作护体热气，临时防御 +1。');
  }
  return true;
}

function raiseDough(state) {
  const spot = adjacentOpenSquares(state, state.player)[0];
  if (!spot) { addLog(state, '周围没有空间发酵面团。'); return false; }
  state.summons.push({ id: `dough-${Date.now()}-${state.rng.int(1, 9999)}`, name: '面团伙伴', hp: 10 + state.player.level * 2, maxHp: 10 + state.player.level * 2, attack: state.player.attack, defense: 0, sprite: 'summon_dough', x: spot.x, y: spot.y });
  addLog(state, '面团伙伴鼓起来，挡在你身边。');
  return true;
}

function nearestEnemy(state, maxRange) {
  return state.enemies
    .filter((e) => distance(e, state.player) <= maxRange)
    .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
}

function adjacentOpenSquares(state, origin) {
  const occupied = new Set([
    key(state.player.x, state.player.y),
    ...state.enemies.map((e) => key(e.x, e.y)),
    ...state.summons.map((s) => key(s.x, s.y)),
  ]);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: origin.x + dx, y: origin.y + dy }))
    .filter((p) => isWalkable(state.map, p.x, p.y) && !occupied.has(key(p.x, p.y)));
}

export function waitTurn(state) {
  if (state.status === 'playing') {
    addLog(state, '你屏息等待。');
    finishPlayerTurn(state);
  }
  return state;
}

function finishPlayerTurn(state) {
  tickCooldownsAndEffects(state);
  summonTurn(state);
  removeDeadEnemies(state);
  enemyTurn(state);
  removeDeadSummons(state);
  checkGameOver(state);
}

function tickCooldownsAndEffects(state) {
  if (state.player.skill?.remaining > 0) state.player.skill.remaining -= 1;
  state.player.effects = state.player.effects
    .map((e) => ({ ...e, turns: e.turns - 1 }))
    .filter((e) => e.turns > 0);
}

function summonTurn(state) {
  for (const summon of state.summons) {
    const target = state.enemies
      .filter((e) => distance(e, summon) === 1)
      .sort((a, b) => a.hp - b.hp)[0];
    if (!target) continue;
    const dmg = Math.max(1, state.player.attack - (target.defense ?? 0));
    target.hp -= dmg;
    addLog(state, `${summon.name}撞击${target.name}造成 ${dmg} 点伤害。`);
  }
}

function removeDeadEnemies(state) {
  [...state.enemies].forEach((enemy) => { if (enemy.hp <= 0) killEnemy(state, enemy); });
}

function enemyTurn(state) {
  const occupied = new Set(state.enemies.map((e) => key(e.x, e.y)));
  for (const enemy of state.enemies) {
    if (state.status !== 'playing') return;
    if (enemy.ability === 'healAlly' && healEnemyAlly(state, enemy)) continue;
    const adjacentSummon = state.summons.find((s) => distance(enemy, s) === 1);
    if (adjacentSummon) {
      attack(state, enemy, adjacentSummon);
      continue;
    }
    if (distance(enemy, state.player) === 1) {
      attack(state, enemy, state.player);
      continue;
    }
    const target = chooseEnemyTarget(state, enemy);
    if (distance(enemy, target) <= 7) {
      const dx = Math.sign(target.x - enemy.x);
      const dy = Math.sign(target.y - enemy.y);
      const candidates = Math.abs(target.x - enemy.x) > Math.abs(target.y - enemy.y)
        ? [{ dx, dy: 0 }, { dx: 0, dy }]
        : [{ dx: 0, dy }, { dx, dy: 0 }];
      for (const step of candidates) {
        const nx = enemy.x + step.dx;
        const ny = enemy.y + step.dy;
        const k = key(nx, ny);
        if (isWalkable(state.map, nx, ny) && !occupied.has(k) && !isPlayerAt(state, nx, ny) && !isSummonAt(state, nx, ny)) {
          occupied.delete(key(enemy.x, enemy.y));
          enemy.x = nx; enemy.y = ny;
          occupied.add(k);
          break;
        }
      }
    }
  }
}

function healEnemyAlly(state, healer) {
  const target = state.enemies
    .filter((e) => e !== healer && e.hp < e.maxHp && distance(e, healer) <= 5)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
  if (!target) return false;
  const amount = healer.healAmount ?? 4;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  addLog(state, `${healer.name}给${target.name}续上一勺热汤。`);
  return true;
}

function chooseEnemyTarget(state, enemy) {
  const candidates = [state.player, ...state.summons];
  return candidates.sort((a, b) => distance(enemy, a) - distance(enemy, b))[0];
}

function isPlayerAt(state, x, y) {
  return state.player.x === x && state.player.y === y;
}

function isSummonAt(state, x, y) {
  return state.summons.some((s) => s.x === x && s.y === y);
}

function removeDeadSummons(state) {
  const before = state.summons.length;
  state.summons = state.summons.filter((s) => s.hp > 0);
  if (before > state.summons.length) addLog(state, '面团伙伴被打散了。');
}

function checkGameOver(state) {
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.status = 'lost';
    addLog(state, '你倒在了地牢里。按 R 重新开始。');
  }
}

export function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, MAX_LOG);
}

export function serializeState(state) {
  return JSON.stringify(state, (k, v) => (k === 'rng' ? { seed: v.seed } : v));
}
