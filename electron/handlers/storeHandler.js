const { BrowserWindow } = require('electron');
const { addImgToProcess, addTextToTraduction } = require('./queueHandler');
const EventEmitter = require('events');

/**
 * TODO this is stale
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
  Object.keys(items).forEach(key => delete items[key]);
  sendToFront('allCleaned');
}

function deleteItemById(id) {
  delete items[id];
  sendToFront('entryDeleted', id);
}

function deleteSectionById(deleteSectionPayload) {
  const sectionId = deleteSectionPayload.sectionId;
  const entryId = deleteSectionPayload.entryId;
  const sections = items[entryId].meta.sections;
  const index = sections.findIndex(section => section.id === sectionId);
  sections.splice(index, 1);
  sendToFront('sectionDeleted', deleteSectionPayload);
  refreshEntryText(entryId);
}

function scanItemById(id) {
  delete items[id]['text'];
  addImgToProcess(items[id], addTextToImg);
}

function translateItemById(id) {
  delete items[id]['trad'];
  sendToFront('entryTranslated', id);
  addTextToTraduction(items[id], addTraductionToImg);
}

function updateItemTextById(textObj) {
  items[textObj.id]['text'] = textObj.text;
  sendToFront('addText', textObj);
}

function updateSectionTextById(textObj) {
  const entry = items[textObj.entryId];
  entry.meta.sections.filter(section => section.id === textObj.id)[0].text = textObj.text;
  console.log("maybe cant be sent to front", textObj);
  sendToFront('addSectionText', textObj);

  //Also update top level text to reflect the change in this section
  refreshEntryText(textObj.entryId);
}

function refreshEntryText(entryId) {
  const entry = items[entryId];
  if(entry.meta.sections.length > 0) {
    entry.text = entry.meta.sections
      .map(section => (section.actorId ? (entry.meta.actors[section.actorId-1] || section.actorId) +":" : "" )+ section.text)
      .reduce((acc, curr) => acc + "\n" + curr );
  } else {
    //Rescan original image...
    addImgToProcess(entry, addTextToImg);
  }
  
  sendToFront('addText', {
    id: entry.id,
    text: entry.text
  });
}

function setSelectedActors(selectedActorsPayload) { 
  const entry = items[selectedActorsPayload.entryId];
  entry.meta.actors = selectedActorsPayload.actors;
  sendToFront('updatedActors', selectedActorsPayload);
  refreshEntryText(entry.id);
}

function appendCaptureToEntry(captureObj) {
  console.log("adding capture to image", captureObj.entryId);
  const entry = items[captureObj.entryId];
  if(entry) {
    entry.meta.sections.push(captureObj);
    sendToFront('newSection', captureObj);
    addImgToProcess(captureObj, updateSectionTextById);
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
      history: [],
      actors: []
    }
  }
  items[imgObj.id] = newEntry;
  sendToFront('newEntry', newEntry);
  addImgToProcess(newEntry, addTextToImg);
}

function addTextToImg(textObj) {
  console.log('Saving detected text');
  items[textObj.id]['text'] = textObj.text;
  sendToFront('addText', textObj);
}

function addTraductionToImg(tradObj) {
  console.log('Saving translated text');
  items[tradObj.id]['trad'] = tradObj.trad;
  sendToFront('addTrad', tradObj);
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
  setSelectedActors,
};
