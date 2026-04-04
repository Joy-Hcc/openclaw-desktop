const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');

const PORT = 18789;
const HOST = '127.0.0.1';
let mainWindow;
let serverProcess = null;
let gatewayToken = null;
let hasInjectedToken = false;

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

// 可能的 openclaw 路径
function getOpenClawPath() {
  const possiblePaths = [
    'openclaw', // 如果在 PATH 中
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'openclaw.cmd'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'openclaw'),
    'C:\\Program Files\\nodejs\\openclaw.cmd',
  ];

  for (const cmdPath of possiblePaths) {
    try {
      if (fs.existsSync(cmdPath) || cmdPath === 'openclaw') {
        return cmdPath;
      }
    } catch (e) {}
  }
  return 'openclaw'; //  fallback
}

// 启动 OpenClaw 服务器
function startServer() {
  return new Promise(async (resolve, reject) => {
    const isRunning = await checkPort(PORT);
    if (isRunning) {
      resolve();
      return;
    }

    const openclawPath = getOpenClawPath();
    console.log('Starting OpenClaw with:', openclawPath);

    // Windows 上直接执行命令
    const command = `"${openclawPath}" gateway`;
    serverProcess = spawn(command, [], {
      shell: true,
      stdio: 'ignore',
      windowsHide: true
    });

    serverProcess.on('error', (err) => reject(new Error(`启动失败: ${err.message}`)));
    serverProcess.on('exit', (code) => {
      console.log(`OpenClaw exited with code ${code}`);
    });

    if (await waitForServer()) resolve();
    else reject(new Error('服务器启动超时'));
  });
}

// 创建主窗口
function createWindow() {
  gatewayToken = loadGatewayToken();

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

  // 加载页面并在加载完成后注入 token
  mainWindow.loadURL(`http://${HOST}:${PORT}/`);

  // 页面加载完成后注入 token（只执行一次）
  mainWindow.webContents.on('did-finish-load', () => {
    if (gatewayToken && !hasInjectedToken) {
      hasInjectedToken = true;
      // 通过 localStorage 设置 token
      mainWindow.webContents.executeJavaScript(`
        const settings = JSON.parse(localStorage.getItem('openclaw.control.settings.v1') || '{}');
        settings.gatewayToken = '${gatewayToken}';
        localStorage.setItem('openclaw.control.settings.v1', JSON.stringify(settings));
        console.log('Token injected');
      `).catch(() => {});

      // 刷新页面使 token 生效
      setTimeout(() => {
        mainWindow.webContents.reload();
      }, 500);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// 应用启动
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Error:', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
