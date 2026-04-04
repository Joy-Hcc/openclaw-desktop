# OpenClaw Desktop

OpenClaw 的 Windows 桌面版，启动即玩，无需手动开启服务器。

## 功能

- 自动检测并启动 OpenClaw 服务器
- 独立窗口运行，无需浏览器
- 自动读取本地 OpenClaw 配置进行认证

## 下载与使用

### 方式一：下载源码自己打包（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Joy-Hcc/openclaw-desktop.git

# 2. 进入目录
cd openclaw-desktop

# 3. 安装依赖
npm install

# 4. 打包为可执行文件
npm run dist
```

打包完成后，在 `dist` 目录下会生成 `OpenClaw.exe`，双击即可运行。

### 方式二：直接下载 Release

前往 [Releases](https://github.com/Joy-Hcc/openclaw-desktop/releases) 页面下载最新版本的 `OpenClaw.exe`。

## 前提条件

使用本软件前，你需要：

1. **安装 OpenClaw CLI** 并配置好网关令牌
2. 确保 `~/.openclaw/openclaw.json` 中有正确的网关 token 配置

### 配置网关令牌

```bash
# 设置你的网关令牌
openclaw config set gateway.auth.mode token
openclaw config set gateway.auth.token "你的令牌"
```

## 开发调试

```bash
# 安装依赖
npm install

# 开发运行（带调试窗口）
npm start

# 打包为可执行文件
npm run dist
```

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
