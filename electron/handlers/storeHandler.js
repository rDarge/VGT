const { BrowserWindow } = require('electron');
const { addImgToProcess, addTextToTraduction } = require('./queueHandler');
const EventEmitter = require('events');

/**
 * Structure of the object that we save for each translation input
 * "1234": {
 *      id: "123" --> Unique UUID
 *      img: "", --> Image in Base64 DataURL
 *      text: "", --> Detected Text
 *      trad: "" --> Translated Text
 *      selectedModel: {} --> Configurations of the model selected at the time of capture
 * }
 */

const items = {};
const eventEmitter = new EventEmitter();

function cleanAll() {
  items = {};
}

function deleteItemById(id) {
  delete items[id];
  eventEmitter.emit('entryDeleted', id);
}

function scanItemById(id) {
  delete items[id]['text'];
  addImgToProcess(items[id], addTextToImg);
}

function translateItemById(id) {
  delete items[id]['trad'];
  eventEmitter.emit('entryTranslated', id);
  addTextToTraduction(items[id], addTraductionToImg);
}

function updateItemTextById(textObj) {
  items[textObj.id]['text'] = textObj.text;
  eventEmitter.emit('newText', textObj);
}

function addNewEntry(imgObj) {
  console.log('Guardando nueva imagen');
  imgObj['text'] = null;
  imgObj['trad'] = null;
  items[imgObj.id] = imgObj;
  eventEmitter.emit('newEntryAdded', imgObj);
}

function addTextToImg(textObj) {
  console.log('Saving detected text');
  items[textObj.id]['text'] = textObj.text;
  eventEmitter.emit('newText', textObj);
}

function addTraductionToImg(tradObj) {
  console.log('Saving translated text');
  items[tradObj.id]['trad'] = tradObj.trad;
  eventEmitter.emit('newTrad', tradObj);
}

//If a new image is added, send it to the frontend and add it to the list
//Then add it to the list for OCR processing
eventEmitter.on('newEntryAdded', (imgObj) => {
  //Send it to the main screen TODO: Optimize to reduce iteration?
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send('newEntry', imgObj);
    }
  });

  //Start OCR process
  addImgToProcess(imgObj, addTextToImg);
});

//When an image has gone through OCR
eventEmitter.on('newText', (textObj) => {
  //Send to the main screen TODO: Optimize to reduce iteration?
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send('addText', textObj);
    }
  });
});

//When an image has its text and translation
eventEmitter.on('newTrad', (tradObj) => {
  //Send to the main screen TODO: Optimize to reduce iteration?
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send('addTrad', tradObj);
    }
  });
});

//When an entry is removed
eventEmitter.on('entryDeleted', (entryId) => {
  //Send to the main screen TODO: Optimize to reduce iteration?
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send('entryDeleted', entryId);
    }
  });
});

//When an entry translation is retried
eventEmitter.on('entryTranslated', (entryId) => {
  //Send to the main screen TODO: Optimize to reduce iteration?
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send('entryTranslated', entryId);
    }
  });
});

module.exports = {
  addNewEntry,
  addTextToImg,
  deleteItemById,
  translateItemById,
  updateItemTextById,
  cleanAll,
  scanItemById,
};
