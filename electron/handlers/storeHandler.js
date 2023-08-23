const { BrowserWindow } = require('electron');
const { addImgToProcess, addTextToTraduction } = require('./queueHandler');
const EventEmitter = require('events');
const ort = require('onnxruntime-node');
const fs = require('fs');
// import * as ort from 'onnxruntime-node'



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

async function localTranslate(localTranslatePayload) {

  const filename = localTranslatePayload.entryId + "-" + localTranslatePayload.sectionId + ".csv";
  const tensorData = localTranslatePayload.tensorData.join(',');
  fs.writeFileSync("C:/tmp/" + filename, tensorData)

  //ENCODER ============================ 
  const entryId = localTranslatePayload.entryId;
  const sectionId = localTranslatePayload.sectionId;
  const section = items[entryId]['meta']['sections'].filter(section => section.id === sectionId)[0];
  console.log('Attempting to perform local translation of image');
  const input_data = new ort.Tensor("float32", new Float32Array(localTranslatePayload.tensorData), [
    1,
    3, 
    224,
    224,
  ]);
  console.log('input data is of size', input_data.dims);

  const session = await ort.InferenceSession.create('./assets/onnx/encoder_model.onnx');
  console.log(session);
  console.log("input names", session.inputNames);
  console.log("output names", session.outputNames);
  const feeds = { pixel_values: input_data}
  // console.log(feeds);
  const results = await session.run(feeds);
  // console.log("results are", results, );

  //DECODER ============================
  const decoderSession = await ort.InferenceSession.create('./assets/onnx/decoder_model.onnx');
  console.log(decoderSession);
  console.log("input names", decoderSession.inputNames);
  console.log("output names", decoderSession.outputNames);
  const input_array = new BigInt64Array(1);

    //Get corresponding vocab
    const vocab = fs.readFileSync('./assets/onnx/vocab.txt', {encoding: 'utf-8'}).split('\r\n')
  
  // Initializing as 1s doesn't seem to work
  input_array.fill(2n);
  // Trying with random values
  // for (let i = 0; i < input_array.length; i++) {
  //   const hexString = Array(16)
  //     .fill()
  //     .map(() => Math.round(Math.random() * 0xF).toString(16))
  //     .join('');
  //   input_array[i] = BigInt(`0x${hexString}`);
  // }
  // Got this error on above attempt: 
  //    [E:onnxruntime:, sequential_executor.cc:514 onnxruntime::ExecuteKernel] 
  //    Non-zero status code returned while running Gather node. 
  //    Name:'/decoder/bert/embeddings/word_embeddings/Gather'
  //    Status Message: indices element out of data bounds, 
  //    idx=-3947328286008448111 must be within the inclusive range [-6144,6143]
  // What if we initialize linearly within those bounds? 
  // for (let i = 0; i < input_array.length; i++) {
  //   input_array[2*i] = BigInt(i);
  //   input_array[2*i+1] = BigInt(1n);//vocab[i];
  // }

  const input_ids = new ort.Tensor("int64", input_array, [
    1,
    1
  ]);
  const nextInput = {input_ids:input_ids, encoder_hidden_states: results.last_hidden_state};
  // console.log("Next input is", nextInput);
  const decodedResults = await decoderSession.run(nextInput);
  // console.log("decoded results are", decodedResults);
  // console.log("data is ", decodedResults.logits.data);

  //SOFTMAX RESULTS
  const logits = decodedResults.logits.data;
  const softmax = [];
  let currentIndex = 0
  let currentValue = logits[0];
  for(let i = 1; i < logits.length; i += 1) {
    if(i % 6144 == 0) {
      softmax.push(currentIndex % 6144 + 1);
      currentIndex = i;
      currentValue = logits[i];
    } else if(currentValue < logits[i]) {
      currentIndex = i;
      currentValue = logits[i];
    }
  }
  softmax.push(currentIndex % 6144 + 1);

  //Mostly 4s, plus occasional 
  console.log("Logits are: ", softmax.filter(val => val !== 4));


  console.log(vocab);
  // const rl = readline.createInterface({input: fileStream})
  // const vocab = [];
  // for await(const line of rl) {
  //   console.log(line);
  //   vocab.push(line);
  // }
  console.log("Final output", softmax.map(idx => vocab[idx]).join(''));


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
  localTranslate,
};
