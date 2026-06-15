# 魔塔 · 经典24层 Web 复刻

经典魔塔风格的 24 层 Web 塔。**自写引擎**（TS + React + Canvas），数据驱动。

🎮 **在线试玩**：https://billqiu.github.io/mota/

> 个人学习 / 致敬作品，非商用。

## 玩法

- 方向键 / WASD 移动，**点击地图自动寻路**
- 钥匙开门（黄/蓝/红/绿）、撞怪即时战斗（伤害预测显示在怪物身上）
- 商店买属性 / 买钥匙、怪物手册（X 键）、多槽位存读档、音效开关
- 逐层向上，顶层击败魔王、营救公主通关

## 数据来源（真实经典数据）

地图与怪物数值**导入自开源经典魔塔** [justinmzt/mota](https://github.com/justinmzt/mota)（素材源自百度魔塔吧、参考魔塔 50 层版）：

- 取其**完整连通的 1–9 层** + 自建魔王殿（源数据 10 层起缺楼梯、未画完）
- 忠实复刻该版本机制：**勇士初始 400 生命 / 攻 10 / 防 10**；**宝石、血瓶按楼层缩放**（红宝石 +楼层 攻、红瓶回 50×楼层…）
- 转换脚本见 `scripts/convert-justinmzt.mjs`，生成 `src/data/imported.ts`

## 技术栈

- **TypeScript + React + Canvas**，Vite 构建
- **纯 TS 逻辑核心**（确定性、可单测）+ **Zustand** 桥接给 React
- Canvas 只画地图格子；HUD / 道具栏 / 对话框 / 菜单 / 存读档全用 React + CSS（像素风还原）
- Vitest 单测覆盖战斗 / 寻路 / 道具 / 存读档

## 架构

```
src/
  core/      纯 TS 引擎：类型、地块字典、战斗公式、寻路、道具、存档、游戏状态机
  data/      内容数据：楼层网格、怪物表、道具表、剧情事件
  store/     Zustand store，桥接引擎与 React
  render/    Canvas 地图渲染
  ui/        React UI：HUD、道具栏、对话框、标题页、存读档
```

## 战斗模型（经典标准）

- 即时结算、勇士先手
- 每回合：勇士对怪 `max(0, 攻−怪防)`，怪对勇士 `max(0, 怪攻−防)`
- 击杀回合 `n = ceil(怪生命 / (攻−怪防))`；攻 ≤ 怪防 → 无法击杀
- 勇士承受总伤害 `= (n−1) × max(0, 怪攻−防)`（先手，末击怪已死不还手）

## 开发

```bash
pnpm install
pnpm dev        # 本地开发
pnpm test       # 单元测试
pnpm build      # 生产构建
```
