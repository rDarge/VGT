const { globalShortcut, BrowserWindow } = require('electron');
const { createCaptureWindow } = require('../windows/winCapture');
const {
  getShortcutConfig,
  getFirstInitReady,
  getInitModelSequenceReady,
} = require('../helpers/config');

//Remove any existing handlers and create a new one for the capture window
function reloadCaptureWinShortcutHandler() {
  //Close any capture window that is already open
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'capture') {
      win.close();
    }
  });
  //Unregister the capture shortcut and create a new one
  globalShortcut.unregisterAll();
  createCaptureWinShortcutHandler();
}

//Create a new handler for the shortcut that creates the capture window
function createCaptureWinShortcutHandler() {
  //TODO: Only accept if the shortcut can actually be performed

  const shortcutKeys = getShortcutConfig();
  const shortcutCombination =
    shortcutKeys.screenshotModifierKey + '+' + shortcutKeys.screenshotLetterKey;

  globalShortcut.register(shortcutCombination, () => {
    //Check to see if the capture window already exists
    let captureIsDisplayed = false;
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.title === 'capture') {
        captureIsDisplayed = true;
      }
    });
    //Only create the window if: it hasn't already been created, the first start has been completed, and the model is ready
    if (
      !captureIsDisplayed &&
      getFirstInitReady() &&
      getInitModelSequenceReady()
    ) {
      createCaptureWindow();
    }
  });
}

module.exports = {
  createCaptureWinShortcutHandler,
  reloadCaptureWinShortcutHandler,
};
