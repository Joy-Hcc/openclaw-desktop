# OpenClaw Desktop

OpenClaw 的 Windows 桌面版，启动即玩，无需手动开启服务器。

## 功能

- 自动检测并启动 OpenClaw 服务器
- 独立窗口运行，无需浏览器
- 自动读取本地 OpenClaw 配置进行认证

## 快速开始

### 1. 安装 OpenClaw CLI

桌面版依赖 OpenClaw CLI 来启动服务器，请先安装：

```bash
# 使用 npm 安装（需要 Node.js 16+）
npm install -g openclaw

# 验证安装
openclaw --version
```

> 如果没有 npm，先安装 [Node.js](https://nodejs.org/)（推荐 LTS 版本）

### 2. 配置网关令牌

```bash
# 设置认证模式为 token
openclaw config set gateway.auth.mode token

# 设置你的网关令牌（从 OpenClaw 获取）
openclaw config set gateway.auth.token "你的令牌"

# 验证配置
openclaw config get gateway.auth.token
```

### 3. 下载桌面版

前往 [Releases](https://github.com/Joy-Hcc/openclaw-desktop/releases) 下载 `OpenClaw.exe`，双击运行即可。

---

## 手动打包（开发者）

如果你想自己修改或打包：

```bash
# 1. 克隆仓库
git clone https://github.com/Joy-Hcc/openclaw-desktop.git

# 2. 进入目录
cd openclaw-desktop

# 3. 安装依赖
npm install

# 4. 开发运行
npm start

# 5. 打包为可执行文件
npm run dist
```

打包完成后，在 `dist` 目录下会生成 `OpenClaw.exe`。

## 项目结构

```
openclaw-desktop/
├── main.js          # 主进程代码
├── preload.js       # 预加载脚本
├── package.json     # 项目配置
├── .gitignore       # Git 忽略配置
└── README.md        # 本文件
```

## 自定义图标（可选）

将 `icon.ico` 放在项目根目录，打包时会自动使用。

可以从以下资源生成图标：
- OpenClaw 官方 Logo
- 或任何 256x256 以上的 PNG 图片，使用在线转换工具转为 .ico

## 许可证

MIT
