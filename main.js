const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');

const PORT = 18789;
const HOST = '127.0.0.1';
const LOCK_PATH = path.join(os.tmpdir(), 'openclaw-desktop.lock');

let mainWindow;
let serverProcess = null;
let gatewayToken = null;
let hasInjectedToken = false;
let releaseLock = null;

// 原子锁：防止同一台机器同时启动多个实例
// 写入 PID，崩溃后新实例可检测并覆盖
function acquireLock() {
  // 已有锁文件时，检查原进程是否还活着
  try {
    const oldPid = parseInt(fs.readFileSync(LOCK_PATH, 'utf8'), 10);
    try { process.kill(oldPid, 0); } catch {
      // 原进程已不存在，清理残留锁
      try { fs.unlinkSync(LOCK_PATH); } catch {}
    }
  } catch {}

  try {
    fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: 'wx' });
  } catch {
    return null;
  }
  return () => { releaseLock = null; try { fs.unlinkSync(LOCK_PATH); } catch {} };
}

// 读取 OpenClaw 配置文件获取 token
function loadGatewayToken() {
  try {
    const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.gateway?.auth?.mode === 'token' && config.gateway.auth.token) {
      return config.gateway.auth.token;
    }
  } catch (e) {
    console.error('Failed to load token:', e.message);
  }
  return null;
}

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(1000);
    client.once('connect', () => {
      client.destroy();
      resolve(true);
    });
    client.once('error', () => resolve(false));
    client.connect(port, HOST);
  });
}

// 等待服务器就绪
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkPort(PORT)) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

// 可能的 openclaw 路径（按优先级排列）
function getOpenClawPath() {
  const possiblePaths = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'openclaw.cmd'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'openclaw'),
    'C:\\Program Files\\nodejs\\openclaw.cmd',
  ];

  for (const cmdPath of possiblePaths) {
    try {
      if (fs.existsSync(cmdPath)) {
        return cmdPath;
      }
    } catch (e) {}
  }
  return 'openclaw'; // fallback: 依赖 PATH
}

// 启动 OpenClaw 服务器
async function startServer() {
  const isRunning = await checkPort(PORT);
  if (isRunning) {
    return;
  }

  releaseLock = acquireLock();
  if (!releaseLock) {
    dialog.showErrorBox('启动失败', '已有 OpenClaw Desktop 实例正在运行');
    app.quit();
    return;
  }

  const openclawPath = getOpenClawPath();
  console.log('Starting OpenClaw with:', openclawPath);

  const command = `"${openclawPath}" gateway`;
  serverProcess = spawn(command, [], {
    shell: true,
    stdio: 'ignore',
    windowsHide: true
  });

  await new Promise((resolve, reject) => {
    serverProcess.on('error', (err) => {
      reject(new Error(`启动失败: ${err.message}`));
    });

    serverProcess.on('exit', (code) => {
      console.log(`OpenClaw exited with code ${code}`);
      if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#e00;"><div><h2>OpenClaw 服务已退出</h2><p>退出码: ${code}</p><p>请检查终端中的错误信息</p></div></div>';
        `).catch(() => {});
      }
    });

    waitForServer().then((ready) => {
      if (ready) resolve();
      else reject(new Error('服务器启动超时'));
    });
  });
}

// 清理服务器进程
function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// 创建主窗口
async function createWindow() {
  gatewayToken = loadGatewayToken();
  hasInjectedToken = false;

  if (!gatewayToken) {
    console.warn('未检测到 gateway token，请运行 openclaw config set gateway.auth.token');
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'OpenClaw',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 通过 cookie 设置 token（支持 cookie 方式读取的应用）
  if (gatewayToken) {
    try {
      await mainWindow.webContents.session.defaultSession.cookies.set({
        url: `http://${HOST}:${PORT}`,
        name: 'openclaw_gateway_token',
        value: gatewayToken
      });
    } catch (e) {
      console.error('Cookie set failed:', e.message);
    }
  }

  // 注入 localStorage（监听器必须在 loadURL 之前注册）
  mainWindow.webContents.on('did-finish-load', () => {
    if (gatewayToken && !hasInjectedToken) {
      hasInjectedToken = true;
      const script = `
        (function() {
          const settings = JSON.parse(localStorage.getItem('openclaw.control.settings.v1') || '{}');
          settings.gatewayToken = ${JSON.stringify(gatewayToken)};
          localStorage.setItem('openclaw.control.settings.v1', JSON.stringify(settings));
        })();
      `;
      mainWindow.webContents.executeJavaScript(script).catch(() => {});
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reload();
        }
      }, 500);
    }
  });

  mainWindow.loadURL(`http://${HOST}:${PORT}/`);

  mainWindow.on('destroyed', () => { mainWindow = null; });
}

// 应用启动
app.whenReady().then(async () => {
  try {
    await startServer();
    await createWindow();
  } catch (err) {
    console.error('Error:', err.message);
    dialog.showErrorBox('启动失败', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopServer();
    if (releaseLock) releaseLock();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  stopServer();
  if (releaseLock) releaseLock();
});
