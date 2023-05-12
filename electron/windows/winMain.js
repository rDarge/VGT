const path = require('path');
const url = require('url');
const { BrowserWindow } = require('electron');

function createMainWindow() {
  //Window instance
  let mainWindow = new BrowserWindow({
    title: 'Visual-GPT-Translator',
    width: 1100,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    //transparent: true, //OJO
    //frame: false, //OJO
    icon: `${__dirname}/../assets/ghost.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  //Load the appropriate window per the execution environment
  //Use hash to indicate the path that should be executed in the context
  let indexPath;
  if (process.env.NODE_ENV === 'development') {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:3000',
      hash: '/',
      pathname: 'index.html',
      slashes: true,
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      hash: '/',
      pathname: path.join(__dirname, '..', '..', 'dist', 'index.html'),
      slashes: true,
    });
  }

  //Prevent window name from being changed by react
  mainWindow.on('page-title-updated', function (e) {
    e.preventDefault();
  });

  mainWindow.loadURL(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

module.exports = {
  createMainWindow,
};
