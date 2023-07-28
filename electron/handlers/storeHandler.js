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

function deleteSectionById(deleteSectionPayload) {
  const sectionId = deleteSectionPayload.sectionId;
  const entryId = deleteSectionPayload.entryId;
  const sections = items[entryId].meta.sections;
  const index = sections.findIndex(section => section.id === sectionId);
  sections.splice(index, 1);
  eventEmitter.emit('sectionDeleted', deleteSectionPayload)
  refreshEntryText(entryId);
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

function updateSectionTextById(textObj) {
  const entry = items[textObj.entryId];
  entry.meta.sections.filter(section => section.id === textObj.id)[0].text = textObj.text;
  eventEmitter.emit('newSectionText', textObj);

  //Also update top level text to reflect the change in this section
  refreshEntryText(textObj.entryId);
}

function refreshEntryText(entryId) {
  const entry = items[entryId];
  entry.text = entry.meta.sections.map(section => section.text).reduce((acc, curr) => acc + curr);
  eventEmitter.emit('newText', {
    id: entry.id,
    text: entry.text
  });
}

function appendCaptureToEntry(captureObj) {
  console.log("adding capture to image", captureObj.entryId);
  const entry = items[captureObj.entryId];
  if(entry) {
    entry.meta.sections.push(captureObj);
    eventEmitter.emit('newSectionAdded', captureObj);
    return true;
  } else {
    return false;
  }
}

function addNewEntry(imgObj) {
  console.log('Guardando nueva imagen');
  const newEntry = { ...imgObj,
    meta: {
      sections: [],
      history: []
    }
  }
  items[imgObj.id] = newEntry;
  eventEmitter.emit('newEntryAdded', newEntry);
}

function addTextToImg(textObj) {
  console.log('Saving detected text');
  items[textObj.id]['text'] = textObj.text;
  eventEmitter.emit('newText', textObj);
}

function addTextToSection(sectionObj) {
  console.log('Saving scanned text for section');
  const sections = items[sectionObj.entryId].meta.sections;
  const section = sections.filter(section => section.id === sectionObj.id)[0];
  section.text = sectionObj.text;
  eventEmitter.emit('newSectionText', sectionObj);
  refreshEntryText(sectionObj.entryId);
}

function addTraductionToImg(tradObj) {
  console.log('Saving translated text');
  items[tradObj.id]['trad'] = tradObj.trad;
  eventEmitter.emit('newTrad', tradObj);
}

function sendToFront(message, object) { 
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send(message, object);
    }
  });
}

//If a new image is added, send it to the frontend and add it to the list
//Then add it to the list for OCR processing
eventEmitter.on('newEntryAdded', (imgObj) => {
  sendToFront('newEntry', imgObj);
  addImgToProcess(imgObj, addTextToImg);
});

eventEmitter.on('newSectionAdded', (sectionObj) => {
  sendToFront('newSection', sectionObj);
  addImgToProcess(sectionObj, addTextToSection);
})

//When an image has gone through OCR
eventEmitter.on('newText', (textObj) => {
  sendToFront('addText', textObj);
});

eventEmitter.on('newSectionText', (textObj) => {
  sendToFront('addSectionText', textObj);
});
//When an image has its text and translation
eventEmitter.on('newTrad', (tradObj) => {
  sendToFront('addTrad', tradObj);
});

//When an entry is removed
eventEmitter.on('entryDeleted', (entryId) => {
  sendToFront('entryDeleted', entryId);
});

//When a section is removed
eventEmitter.on('sectionDeleted', (deleteSectionPayload) => {
  sendToFront('sectionDeleted', deleteSectionPayload);
});

//When an entry translation is retried
eventEmitter.on('entryTranslated', (entryId) => {
  sendToFront('entryTranslated', entryId);
});

module.exports = {
  addNewEntry,
  addTextToImg,
  deleteItemById,
  translateItemById,
  updateItemTextById,
  cleanAll,
  scanItemById,
  appendCaptureToEntry,
  updateSectionTextById,
  deleteSectionById,
};
