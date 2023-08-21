const { ipcMain, screen, desktopCapturer, BrowserWindow } = require('electron');
const { addNewEntry, deleteItemById, updateItemTextById, translateItemById, scanItemById, appendCaptureToEntry, updateSectionTextById, deleteSectionById, cleanAll, setSelectedActors, localTranslate } = require('./storeHandler');
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
const { createCaptureWindow } = require('../windows/winCapture');

function getScreenDetails(display) {
  const width = Math.floor(display.size.width * display.scaleFactor);
  const height = Math.floor(display.size.height * display.scaleFactor);

  return {
    id: display.id.toString(),
    width,
    height,
  }
}

function getPointOnClosestScreen(dipPoint, display) {
  //Calculate position and screen height/width
  const x = Math.floor((dipPoint.x  - display.bounds.x) * display.scaleFactor);
  const y = Math.floor((dipPoint.y  - display.bounds.y) * display.scaleFactor);
  
  return { x, y };
}

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

  ipcMain.on('reset', async () => {
    updateEntry = null;
    cleanAll();
  });

  /*
   * Mode 1 Panel Events
   */
  ipcMain.on('deleteEntry', (_e, entryId) => {
    deleteItemById(entryId);
  });
  ipcMain.on('deleteSection', (_e, deleteSectionPayload) => {
    deleteSectionById(deleteSectionPayload);
  });
  ipcMain.on('translateEntry', (_e, entryId) => {
    translateItemById(entryId);
  });
  ipcMain.on('updateEntryText', (_e, textObj) => {
    updateItemTextById(textObj);
  });
  ipcMain.on('updateSectionText', (_e, textObj) => {
    updateSectionTextById(textObj);
  });
  ipcMain.on('scanEntry', (_e, entryId) => {
    scanItemById(entryId);
  });
  ipcMain.on('startTextCapture', (_e, entryId) => {
    createCaptureWindow();
    updateEntry = entryId;
  });
  ipcMain.on('stopTextCapture', (_e) => {
    updateEntry = null;
  });
  ipcMain.on('setSelectedActors', (_e, selectedActorsPayload) => {
    setSelectedActors(selectedActorsPayload);
  });
  ipcMain.on('localTranslate', (_e, localTranslatePayload) => {
    localTranslate(localTranslatePayload);
  })

  /*
   * Screen Capture Events
   */
  let screenDetails = null;
  let p1Coords = null;
  let p2Coords = null;
  let updateEntry = null;
  let actorIndex = 0;

  ipcMain.on('event/mousedown', () => {
    const dipPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(dipPoint);
    screenDetails = getScreenDetails(display)
    p1Coords = getPointOnClosestScreen(dipPoint, display);
  });

  ipcMain.on('event/mouseup', () => {
    const dipPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(dipPoint);
    p2Coords = getPointOnClosestScreen(dipPoint, display);
  });

  ipcMain.handle('captureScreenshot', async (_e, actorId) => {
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

      //Find corresponding source for the screenshot 
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: screenDetails.width, height: screenDetails.height },
      });
      const chosenSource = sources.filter(source => source.display_id === screenDetails.id)[0];

      //Crop the screenshot to the specified area 
      //Generate a URL with the image data
      //TODO: Validate that the image has content; sometimes it doesn't
      const img = chosenSource.thumbnail.crop(captureRectZone).toDataURL();

      //Save the image with a unique ID and specify the model selected at the time of capture
      if(updateEntry != null) {
        const addedSuccessfully = appendCaptureToEntry({
          id: uuid.v4(),
          entryId: updateEntry,
          img: img,
          actorId: actorId
        }); 
        if(!addedSuccessfully){
          //In certain cases the "updateEntry" record may become stale. 
          updateEntry = null;
        }
      } else {
        addNewEntry({
          id: uuid.v4(),
          img: img,
          selectedModel: getSelectedOpenAiModelProprieties(),
        });

        //Close all capture windows.
        BrowserWindow.getAllWindows().forEach((win) => {
          if (win.title.startsWith("capture")) {
            win.close();
          }
        });
      }
    }
    p1Coords = null;
    p2Coords = null;
    screenDetails = null;
    return;
  });
}

module.exports = {
  ipcHandler,
};
