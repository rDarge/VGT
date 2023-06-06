const path = require('path');
const url = require('url');
const { BrowserWindow, screen } = require('electron');

function createCaptureWindow() {
  screen.getAllDisplays().forEach(function (screen) {
    //Window instance
    const captureWindow = new BrowserWindow({
      title: 'capture-' + screen.id,
      x: screen.bounds.x,
      y: screen.bounds.y,
      width: screen.bounds.width,
      height: screen.bounds.height,
      show: false,
      transparent: true,
      frame: false,
      resizable: true,
      minimizable: false,
      fullscreenable: false,
      backgroundColor: '#00ffffff',
      hasShadow: false,
      alwaysOnTop: true,
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
        hash: '/capture',
        pathname: 'index.html',
        slashes: true,
      });
    } else {
      indexPath = url.format({
        protocol: 'file:',
        hash: '/capture',
        pathname: path.join(__dirname, '..', '..', 'dist', 'index.html'), //Traverse upwards from the execution path to reach the correct page in PROD
        slashes: true,
      });
    }

    //Select on which screen to open the grabber
    //const screenList = screen.getAllDisplays();
    //captureWindow.setBounds(screenList[1].workArea);

    //Prevent the window name from being changed by React
    captureWindow.on('page-title-updated', function (e) {
      e.preventDefault();
    });

    //Load window content
    captureWindow.loadURL(indexPath);

    //captureWindow.setBackgroundColor('#00000000');

    captureWindow.maximize(); // TODO: Pass as property to window instance?

    captureWindow.once('ready-to-show', () => {
      captureWindow.show();
    });
  });
}

module.exports = {
  createCaptureWindow,
};
