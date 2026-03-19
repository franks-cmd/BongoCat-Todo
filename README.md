# BongoCat-Todo — 桌面猫咪待办提醒

基于 [BongoCat](https://github.com/ayangweb/BongoCat) 桌面宠物和 [TodoMaster](https://github.com/franks-cmd/todomaster) 待办管理的融合项目。在保留 BongoCat 所有功能的基础上，新增了待办事项管理和智能提醒功能。

## 功能特性

### 原有 BongoCat 功能（完整保留）

- 跨平台桌面宠物（macOS、Windows、Linux）
- 键盘、鼠标、手柄操作同步猫咪动作
- Live2D 模型渲染，支持自定义模型
- 透明窗口、窗口置顶、窗口穿透
- 镜像模式、窗口大小/透明度/圆角调节
- 多语言支持（中文、英文、越南语、葡萄牙语）

### 新增待办提醒功能

- **待办事项 CRUD** — 创建、查看、编辑、删除待办事项
- **分类管理** — 自定义分类并设置颜色标识
- **优先级设置** — 支持高、中、低三级优先级
- **截止日期** — 为待办事项设置截止日期
- **智能提醒** — 根据优先级和截止日期自动弹出提醒：
  - 高优先级：截止前 60 分钟、30 分钟、到期时提醒
  - 中优先级：截止前 30 分钟、到期时提醒
  - 低优先级：到期时提醒
  - 逾期任务：持续定期提醒直至完成
- **猫咪气泡提醒** — 猫咪窗口上方弹出提醒气泡
- **系统通知** — 同时发送系统原生通知
- **搜索和过滤** — 按关键词、分类、优先级、完成状态筛选
- **本地数据持久化** — 所有数据本地存储，无需服务器

## 技术栈

| 层级     | 技术                                                |
| -------- | --------------------------------------------------- |
| **前端** | Vue 3 + TypeScript + Vite + UnoCSS + Ant Design Vue |
| **后端** | Rust (Tauri 2)                                      |
| **渲染** | Pixi.js + pixi-live2d-display                       |
| **状态** | Pinia + @tauri-store/pinia (持久化)                 |
| **通知** | tauri-plugin-notification                           |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Rust >= 1.75
- 平台开发依赖（参考 [Tauri 2 Prerequisites](https://v2.tauri.app/start/prerequisites/)）

### 安装步骤

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd BongoCat-Todo

# 2. 安装前端依赖
pnpm install

# 3. 开发模式启动（前端 + Tauri 同时启动）
pnpm tauri dev

# 4. 构建生产版本
pnpm tauri build
```

## 项目结构

```
BongoCat-Todo/
├── src/                         # Vue 前端
│   ├── components/
│   │   ├── todo-reminder/       # 🆕 提醒气泡组件
│   │   ├── pro-list/            # 列表组件
│   │   └── update-app/          # 更新组件
│   ├── composables/
│   │   ├── useReminder.ts       # 🆕 提醒逻辑
│   │   ├── useDevice.ts         # 设备输入监听
│   │   └── ...
│   ├── pages/
│   │   ├── main/                # 猫咪主窗口（+ 提醒气泡）
│   │   └── preference/
│   │       └── components/
│   │           ├── todo/        # 🆕 待办管理页面
│   │           ├── cat/         # 猫咪设置
│   │           ├── general/     # 通用设置
│   │           └── ...
│   ├── stores/
│   │   ├── todo.ts              # 🆕 待办数据 Store
│   │   ├── cat.ts               # 猫咪设置
│   │   └── ...
│   ├── types/
│   │   └── todo.ts              # 🆕 待办类型定义
│   └── locales/                 # 多语言（已更新）
├── src-tauri/                   # Rust 后端
│   ├── src/
│   │   ├── core/
│   │   │   ├── device.rs        # 键鼠监听
│   │   │   └── gamepad.rs       # 手柄支持
│   │   └── lib.rs               # 应用入口（+ notification 插件）
│   └── capabilities/
│       └── default.json         # 权限配置（+ notification）
├── package.json
├── Cargo.toml
└── README.md
```

## 测试方法

### 1. 开发模式测试

```bash
# 启动开发服务器
pnpm tauri dev
```

### 2. 功能测试清单

#### 猫咪基础功能（回归测试）

- [ ] 猫咪窗口正常显示
- [ ] 键盘操作同步猫咪手部动作
- [ ] 鼠标移动同步猫咪眼球
- [ ] 右键菜单正常工作
- [ ] 窗口拖拽、缩放正常
- [ ] 偏好设置窗口各选项正常

#### 待办管理功能

- [ ] 进入偏好设置 → "待办提醒" 标签页
- [ ] 创建分类（填写名称、选择颜色）
- [ ] 添加待办事项（标题、描述、优先级、截止日期、分类）
- [ ] 编辑已有待办事项
- [ ] 删除待办事项（需确认）
- [ ] 标记待办为已完成
- [ ] 搜索过滤待办事项
- [ ] 按优先级/状态/分类筛选

#### 提醒功能

- [ ] 开启/关闭提醒开关
- [ ] 创建一个截止时间为 1 分钟后的高优先级待办
- [ ] 等待约 30 秒，猫咪窗口上方应出现提醒气泡
- [ ] 点击"完成"按钮，待办应标记为已完成
- [ ] 创建新的待办，点击"稍后提醒"按钮，气泡消失
- [ ] 验证系统通知是否弹出

### 3. 构建测试

```bash
# 构建生产版本
pnpm tauri build

# 构建产物在 src-tauri/target/release/bundle/ 下
```

### 4. 前端单独开发（不启动 Tauri）

```bash
# 仅启动前端 dev server（部分 Tauri API 不可用）
pnpm dev
```

## 致谢

- [BongoCat](https://github.com/ayangweb/BongoCat) — 原始桌面猫咪项目 by ayangweb
- [TodoMaster](https://github.com/franks-cmd/todomaster) — 待办管理功能灵感来源 by franks-cmd
- [Tauri](https://tauri.app/) — 跨平台桌面应用框架
