# OpenClaw Desktop

OpenClaw 的 Windows 桌面版，启动即玩，无需手动开启服务器。

## 功能

- 自动检测并启动 OpenClaw 服务器
- 独立窗口运行，无需浏览器
- 打包为单个可执行文件，方便分发

## 开发

```bash
# 安装依赖
npm install

# 开发运行
npm start

# 打包为可执行文件
npm run dist
```

## 图标

将 `icon.ico` 放在项目根目录（可选，如果没有则使用默认图标）。

可以从以下资源生成图标：
- OpenClaw 官方 Logo
- 或任何 256x256 以上的 PNG 图片，使用在线转换工具转为 .ico
