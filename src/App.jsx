import React, { useEffect, useMemo, useState } from 'react';
import { CLASSES, TILE_SIZE, TILES } from './game/data.js';
import { movePlayer, newGame, useItem, useSkill, waitTurn } from './game/engine.js';
import { sprites } from './sprites.js';
import './style.css';

function cloneState(state) {
  return {
    ...state,
    player: { ...state.player, inventory: [...state.player.inventory], skill: { ...state.player.skill }, effects: [...state.player.effects] },
    enemies: state.enemies.map((e) => ({ ...e })),
    items: state.items.map((i) => ({ ...i })),
    summons: state.summons.map((s) => ({ ...s })),
    log: [...state.log],
    map: { ...state.map, tiles: state.map.tiles.map((r) => [...r]), rooms: state.map.rooms.map((r) => ({ ...r })) },
  };
}

export default function App() {
  const [classId, setClassId] = useState('fighter');
  const [state, setState] = useState(() => newGame('fighter'));
  const [started, setStarted] = useState(false);

  const restart = (cls = classId) => {
    setState(newGame(cls));
    setStarted(true);
  };
  const returnToMenu = () => {
    setStarted(false);
  };
  const apply = (fn) => setState((old) => { const next = cloneState(old); next.rng = old.rng; return fn(next); });

  useEffect(() => {
    const onKey = (e) => {
      if (!started) return;
      const k = e.key.toLowerCase();
      const dirs = { arrowup: [0, -1], w: [0, -1], k: [0, -1], arrowdown: [0, 1], s: [0, 1], j: [0, 1], arrowleft: [-1, 0], a: [-1, 0], h: [-1, 0], arrowright: [1, 0], d: [1, 0], l: [1, 0] };
      if (dirs[k]) {
        e.preventDefault();
        apply((next) => movePlayer(next, dirs[k][0], dirs[k][1]));
      } else if (k >= '1' && k <= '8') {
        apply((next) => useItem(next, Number(k) - 1));
      } else if (k === 'q') {
        apply((next) => useSkill(next));
      } else if (k === '.' || k === ' ') {
        apply((next) => waitTurn(next));
      } else if (k === 'r') returnToMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, classId]);

  if (!started) {
    return <main className="menu">
      <h1>地牢炖汤</h1>
      <p>传统回合制肉鸽：随机地牢、永久死亡、探索、捡装备、职业技能。灵感参考 DCSS/石头汤，但素材与规则为原创。</p>
      <div className="classGrid">{Object.values(CLASSES).map((c) => <button key={c.id} className={classId === c.id ? 'selected' : ''} onClick={() => setClassId(c.id)}>
        <img src={sprites[c.sprite]} alt={c.name} /><b>{c.name}</b><span>{c.desc}</span><em>技能：{c.skill.name} — {c.skill.desc}</em>
      </button>)}</div>
      <button className="start" onClick={() => restart(classId)}>开始下地牢</button>
      <p className="hint">操作：方向键/WASD/vi 键移动，Q 使用技能，数字 1-8 使用物品，空格或句号等待，R 返回选角色界面。走向自己的召唤物可与它换位。</p>
    </main>;
  }

  return <main className="game">
    <section className="board" style={{ width: state.map.width * TILE_SIZE, height: state.map.height * TILE_SIZE }}>
      {state.map.tiles.flatMap((row, y) => row.map((tile, x) => <Tile key={`${x},${y}`} tile={tile} x={x} y={y} />))}
      {state.items.map((item) => <Sprite key={item.uid} entity={item} />)}
      {state.summons.map((summon) => <Sprite key={summon.id} entity={summon} hp summon />)}
      {state.enemies.map((enemy, i) => <Sprite key={`${enemy.id}-${i}-${enemy.x}-${enemy.y}`} entity={enemy} hp />)}
      <Sprite entity={state.player} player />
      {state.status !== 'playing' && <div className="overlay"><h2>{state.status === 'won' ? '胜利！' : '你死了'}</h2><button onClick={() => restart(classId)}>再来一局</button></div>}
    </section>
    <aside className="panel">
      <h2>第 {state.depth} 层</h2>
      <Stats p={state.player} />
      <SkillBox skill={state.player.skill} effects={state.player.effects} onUse={() => apply((next) => useSkill(next))} />
      <button className="waitButton" onClick={() => apply((next) => waitTurn(next))}>等待一回合 <kbd>空格</kbd> / <kbd>.</kbd></button>
      <h3>背包</h3>
      <div className="inventory">{state.player.inventory.length === 0 ? <em>空</em> : state.player.inventory.map((item, i) => <button key={item.uid} onClick={() => apply((next) => useItem(next, i))}><span>{i + 1}</span><img src={sprites[item.sprite]} alt={item.name} />{item.name}</button>)}</div>
      <h3>日志</h3>
      <ul className="log">{state.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </aside>
  </main>;
}

function Tile({ tile, x, y }) {
  const src = tile === TILES.wall ? sprites.tile_wall : tile === TILES.stairs ? sprites.tile_stairs : sprites.tile_floor;
  return <img className="tile" src={src} alt={tile} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }} />;
}

function Sprite({ entity, player, hp, summon }) {
  return <div className={`sprite ${player ? 'player' : ''} ${summon ? 'summon' : ''}`} style={{ left: entity.x * TILE_SIZE, top: entity.y * TILE_SIZE }}>
    <img src={sprites[entity.sprite]} alt={entity.name} title={entity.name} />
    {hp && <small>{entity.hp}</small>}
  </div>;
}

function Stats({ p }) {
  const hpPct = useMemo(() => `${Math.max(0, Math.round((p.hp / p.maxHp) * 100))}%`, [p.hp, p.maxHp]);
  const effectDefense = p.effects.reduce((sum, e) => sum + (e.defenseBonus ?? 0), 0);
  return <div className="stats">
    <b>{p.name}</b><div className="bar"><i style={{ width: hpPct }} /></div>
    <p>HP {p.hp}/{p.maxHp}　攻 {p.attack}　防 {p.defense + effectDefense}</p>
    <p>等级 {p.level}　经验 {p.xp}/{p.level * 18}</p>
  </div>;
}

function SkillBox({ skill, effects, onUse }) {
  return <div className="skillBox">
    <h3>技能 <kbd>Q</kbd></h3>
    <button disabled={skill.remaining > 0} onClick={onUse}>
      <b>{skill.name}</b>
      <span>{skill.remaining > 0 ? `冷却 ${skill.remaining}` : '可用'}</span>
    </button>
    <p>{skill.desc}</p>
    {effects.length > 0 && <div className="effects">{effects.map((e) => <i key={e.id}>{e.name} {e.turns}</i>)}</div>}
  </div>;
}
