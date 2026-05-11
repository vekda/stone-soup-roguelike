# 技能系统与双新角色 Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** 在《地牢炖汤》现有传统肉鸽基础上加入每个职业一项特色主动技能，并新增 2 个差异化角色，保持当前怪物难度不下调。

**Architecture:** 技能作为职业配置的一部分保存在 `src/game/data.js`，运行态在 `player.skill` 中保存冷却。`src/game/engine.js` 暴露 `useSkill(state)`，技能消耗玩家回合并触发怪物回合；如果技能不可用或没有合法目标，则不消耗回合。UI 在侧边栏展示技能名称、说明、冷却和快捷键 `Q`。

**Tech Stack:** React + Vite + Node test runner + 原创 SVG 像素素材。

---

## 设计原则

1. **不降低怪物强度。** 不改 `ENEMY_TYPES` 数值，不减少刷怪数量。
2. **技能提供战术选择，不提供无脑保命。** 多数技能有冷却、范围或副作用。
3. **每个职业差异化：**
   - 铁锅战士：近战防守反击。
   - 香料法师：远程群体爆发。
   - 菜刀游侠：机动与暴击连击。
   - 新角色“汤药医师”：资源/治疗/稳扎稳打，低攻击。
   - 新角色“酵母召唤师”：召唤物/挡刀/控场，角色本体脆。
4. **保持传统 roguelike 回合制。** 使用技能等于一回合，除非技能失败。
5. **文档优先。** 后续重开对话时先读本文件与 `README.md`，再继续开发。
6. **召唤物不应卡死玩家。** 玩家主动走向自己的召唤物时与其交换位置；等待键为空格或 `.`，可用于战术性让怪先动或消耗冷却。
7. **物品是瞬间动作。** 使用药水、食物、装备、卷轴不触发敌人回合，也不推进技能冷却；职业技能和等待仍消耗回合。
8. **召唤物要贡献输出。** 面团伙伴每个玩家回合后先于怪物行动，若相邻敌人存在，则造成等于酵母召唤师当前攻击、再扣除目标防御的伤害。

## 技能设计

| 职业 | 定位 | 技能 | 冷却 | 效果 |
|---|---|---|---:|---|
| 铁锅战士 | 高防稳定 | 锅盖猛击 | 4 | 对相邻敌人造成 `攻击+防御+4` 伤害，并给自己 2 回合 `guard`，期间受到伤害 -2。 |
| 香料法师 | 脆皮爆发 | 辣雾爆燃 | 5 | 对距离 5 内所有敌人造成 8 伤害。 |
| 菜刀游侠 | 机动刺杀 | 影步背刺 | 4 | 瞬移到距离 6 内最近敌人旁边，并对其造成 `攻击+6` 伤害。 |
| 汤药医师 | 续航辅助 | 急煮药汤 | 6 | 回复 10 HP，并清除自身 `guard` 以外的负面状态；若满血则改为临时防御 1 点 3 回合。 |
| 酵母召唤师 | 召唤控场 | 发酵面团 | 7 | 在相邻空格召唤一个“面团伙伴”，敌人会攻击它；伙伴持续存在直到死亡或下楼。面团会在玩家回合结束、怪物行动前攻击相邻敌人，伤害等于召唤师当前攻击。 |

## 数据模型

`player.skill`:

```js
{
  id: 'shield_bash',
  name: '锅盖猛击',
  desc: '...',
  cooldown: 4,
  remaining: 0
}
```

`player.effects`: 数组，元素如 `{ id: 'guard', name: '防守', turns: 2, damageReduction: 2 }`。

`summons`: 数组，元素如 `{ id:'dough', name:'面团伙伴', hp:10, attack:2, defense:0, sprite:'summon_dough', x, y }`。

## 任务列表

### Task 1: 写失败测试覆盖职业数量与技能初始化

**Files:**
- Modify: `tests/game.test.js`

**Test:**
- `CLASSES` 应有 5 个职业。
- 每个职业必须有 `skill` 和 `sprite`。
- `newGame('healer')` 和 `newGame('summoner')` 初始化正确。

**Run:** `npm test`

**Expected RED:** 因为还没有新职业/技能字段而失败。

### Task 2: 写失败测试覆盖技能行为

**Files:**
- Modify: `tests/game.test.js`

**Test:**
- `useSkill` 导出存在。
- 战士技能伤害相邻敌人并进入冷却。
- 医师技能治疗但不超过上限。
- 召唤师技能生成 `summons`。

**Run:** `npm test`

**Expected RED:** `useSkill` 不存在或行为未实现。

### Task 3: 实现职业配置与引擎技能系统

**Files:**
- Modify: `src/game/data.js`
- Modify: `src/game/engine.js`

**Implementation:**
- 为 5 个职业添加 `skill` 字段。
- `newGame` 初始化 `player.skill`、`player.effects`、`summons`。
- 新增 `useSkill(state)`。
- 回合结束处理冷却和持续效果。
- 敌人优先攻击相邻召唤物，否则攻击玩家。

**Run:** `npm test`

**Expected GREEN:** 所有逻辑测试通过。

### Task 4: 更新 UI 快捷键与状态展示

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/style.css`

**Implementation:**
- `Q` 使用技能。
- 侧边栏展示技能、冷却、效果。
- 地图渲染召唤物。
- 角色选择界面显示 5 个职业，卡片能容纳技能说明。

**Run:** `npm run build`

**Expected:** 构建成功。

### Task 5: 新增两个角色和召唤物图片素材

**Files:**
- Modify: `scripts/generate-assets.mjs`
- Generated: `public/assets/hero_healer.svg`
- Generated: `public/assets/hero_summoner.svg`
- Generated: `public/assets/summon_dough.svg`
- Generated: `src/sprites.js`

**Run:** `node scripts/generate-assets.mjs`

**Expected:** 资源数量增加到至少 19。

### Task 6: 更新文档和单文件版

**Files:**
- Modify: `README.md`
- Existing: `scripts/make-single-html.mjs`
- Output: `地牢炖汤-单文件版.html`

**Implementation:**
- README 记录技能系统、新角色、按键。
- 运行 `npm run build && node scripts/make-single-html.mjs`。

**Verification:**
- `npm test`
- `npm run build`
- 单文件包含 `data:image/svg+xml`，无 `/assets` 外链。
