# 魔塔 · 经典24层 Web 复刻

像素级复刻经典魔塔 24 层的 Web 版本。**自写引擎**，地图/数值/道具参考 H5mota 社区开源数据。

> 个人学习 / 致敬作品，非商用。

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
