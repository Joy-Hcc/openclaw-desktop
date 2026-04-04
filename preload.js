const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 安全暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 预留：从主进程接收消息
  on: (channel, callback) => {
    const validChannels = ['from-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
  // 预留：向主进程发送消息
  send: (channel, data) => {
    const validChannels = ['to-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});
