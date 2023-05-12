const { ipcMain, screen, desktopCapturer, BrowserWindow } = require('electron');
const { addNewEntry, deleteItemById } = require('./storeHandler');
const uuid = require('uuid');
const {
  getFullConfigs,
  saveConfig,
  resetConfig,
  getFirstInitReady,
  setFirstInitReady,
  getInitModelSequenceReady,
  getSelectedOpenAiModelProprieties
} = require('../helpers/config');
const { reloadCaptureWinShortcutHandler } = require('./shortcutsHandler');

function ipcHandler() {
  /**
   * Model Verification Events
   */

  //Handle inquiries regarding whether the model is ready
  ipcMain.handle('getInitModelSequenceReady', async () => {
    return getInitModelSequenceReady();
  });

  /**
   * Boot Sequence Events
   */

  //Handles inquiries regarding whether the system has completed startup steps
  ipcMain.handle('getFirstInitReady', async () => {
    return getFirstInitReady();
  });

  //Change the state of FirstInitReady
  ipcMain.on('setFirstInitReady', (e, status) => {
    setFirstInitReady(status);
  });

  /*
   * Settings Panel Events
   */

  //Handles requests to get the current settings
  ipcMain.handle('getConfig', async () => {
    return getFullConfigs();
  });

  //Validates that the API key is correct
  ipcMain.handle('checkApiKey', async () => {
    //TODO: Query the backend to check the validity of the key
    return true;
  });

  //Handles setting updates from react
  ipcMain.on('setConfig', (e, values) => {
    const prevConfigs = getFullConfigs();
    saveConfig(values); // Save the new configurations

    //In cas the user changes the capture window shortcut, reload the shortcut handler
    if (
      prevConfigs.screenshotLetterKey !== values.screenshotLetterKey ||
      prevConfigs.screenshotModifierKey !== values.screenshotModifierKey
    ) {
      reloadCaptureWinShortcutHandler();
    }

    //Emit an event with the updated configurations
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.title === 'Visual-GPT-Translator') {
        win.webContents.send('refreshConfig', getFullConfigs());
      }
    });
  });

  //Reset the settings to the default
  ipcMain.on('resetConfig', async () => {
    resetConfig();

    //Reset the shortcut handler (in case it was changed)
    reloadCaptureWinShortcutHandler();

    //Emit an event with the updated configurations
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.title === 'Visual-GPT-Translator') {
        win.webContents.send('refreshConfig', getFullConfigs());
      }
    });
  });

  /*
   * Mode 1 Panel Events
   */
  ipcMain.on('deleteEntry', (_e, entryId) => {
    deleteItemById(entryId);
  });

  /*
   * Screen Capture Events
   */
  let p1Coords = null;
  let p2Coords = null;

  ipcMain.on('event/mousedown', () => {
    p1Coords = screen.dipToScreenPoint(screen.getCursorScreenPoint());
  });

  ipcMain.on('event/mouseup', () => {
    p2Coords = screen.dipToScreenPoint(screen.getCursorScreenPoint());
  });

  //TODO: Support multiple monitors
  ipcMain.handle('captureScreenshot', async () => {
    if (p1Coords && p2Coords) {
      //Calculate the capture rectangle
      let xOrigin = p1Coords.x;
      if (p1Coords.x > p2Coords.x) {
        xOrigin = p2Coords.x;
      }
      let yOrigin = p1Coords.y;
      if (p1Coords.y > p2Coords.y) {
        yOrigin = p2Coords.y;
      }
      //Manipulate the dimensions slightly so none of the background color used in the clipping process appears
      const captureRectZone = {
        x: xOrigin + 1,
        y: yOrigin + 1,
        width: Math.abs(p1Coords.x - p2Coords.x) - 1,
        height: Math.abs(p1Coords.y - p2Coords.y) - 1,
      };

      //If the image is very small, do not analyze anything
      if (captureRectZone.width < 25 || captureRectZone.height < 25) {
        return;
      }

      //Calculate the full size of the screen  //TODO: Update if the monitor resolution or scale factor changes
      const screenDetails = screen.getPrimaryDisplay();
      const screenWidth = screenDetails.size.width * screenDetails.scaleFactor;
      const screenHeight =
        screenDetails.size.height * screenDetails.scaleFactor;

      //Take screenshot
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: screenWidth, height: screenHeight },
      });

      //Crop the screenshot to the specified area
      //Generate a URL with the image data
      const img = sources[0].thumbnail.crop(captureRectZone).toDataURL();
      //TODO: Validate that the image has content (sometimes it doesn't)

      //Save the image with a unique ID and specify the model selected at the time of capture
      addNewEntry({
        id: uuid.v4(),
        img: img,
        selectedModel: getSelectedOpenAiModelProprieties(),
      });
    }
    p1Coords = null;
    p2Coords = null;
    return;
  });

  ipcMain.on('closeCaptureWin', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.title === 'capture') {
        win.close();
      }
    });
  });
}

module.exports = {
  ipcHandler,
};
