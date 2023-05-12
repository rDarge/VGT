const { app } = require('electron');
const { createMainWindow } = require('./electron/windows/winMain');
const {
  createCaptureWinShortcutHandler,
} = require('./electron/handlers/shortcutsHandler');
const { initBackend } = require('./electron/helpers/backendRunner');
const { ipcHandler } = require('./electron/handlers/ipcHandler');
const {
  checkInitialConfig,
  resetConfig,
  resetFirstInit,
} = require('./electron/helpers/config');
const { initModelSequence } = require('./electron/helpers/initModelSequence');

//resetConfig();
//resetFirstInit();

checkInitialConfig(); //Set and/or load initial configurations

ipcHandler(); //Initialize handlers

initBackend(); //Initialize backend

app.on('ready', () => {
  //Load the backend models and then initialzie the main window and shortcut handler
  initModelSequence().then(() => {
    createMainWindow();
    createCaptureWinShortcutHandler();
  });
});


//If closed with "ctrl-c", this is not executed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
