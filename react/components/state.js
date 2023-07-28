import { createGlobalState } from 'react-hooks-global-state';

const initialState = {
  entries: {},
  config: {},
  firstInitReady: true, //By default we assume the user has already completed the first start
  initModelSequenceReady: false, //By default we assume that the model is not loaded on the disk
  backendTerminalStreaming: [], //To buffer the output of the backend terminal
};
const { setGlobalState, useGlobalState } = createGlobalState(initialState);


export const deleteAllEntries = () => {
  setGlobalState('entries', (oldEntries) => {
    return {};
  });
};

export const addNewEntry = (newEntry) => {
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries };
    newObjAux[newEntry.id] = newEntry;
    return newObjAux;
  });
};

export const addNewSection = (newSection) => {
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries };
    newObjAux[newSection.entryId].meta.sections.push(newSection);
    return newObjAux;
  });
};

export const deleteEntry = (entryId) => {
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries };
    delete newObjAux[entryId];
    return newObjAux;
  });
};


export const deleteSection = (deleteSectionPayload) => {
  const sectionId = deleteSectionPayload.sectionId;
  const entryId = deleteSectionPayload.entryId;
  
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries };
    const sections = newObjAux[entryId].meta.sections;
    const index = sections.findIndex(section => section.id === sectionId);
    sections.splice(index, 1);
    return newObjAux;
  });
};

export const translateEntry = (entryId) => {
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries};
    delete newObjAux[entryId]['trad']
    return newObjAux;
  })
}

export const addText = (newText) => {
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries };
    newObjAux[newText.id]['text'] = newText.text;
    return newObjAux;
  });
};


export const addSectionText = (newText) => {
  console.log("New Text is", newText);
  setGlobalState('entries', (oldEntries) => {
    console.log("oldEntries", oldEntries);
    const newObjAux = { ...oldEntries };
    newObjAux[newText.entryId].meta.sections.filter(section => section.id === newText.id)[0].text = newText.text;
    console.log("Added section text: ", newObjAux);
    return newObjAux;
  });
};

export const addTrad = (newTrad) => {
  setGlobalState('entries', (oldEntries) => {
    const newObjAux = { ...oldEntries };
    newObjAux[newTrad.id]['trad'] = newTrad.trad;
    return newObjAux;
  });
};

export const updateConfig = (config) => {
  setGlobalState('config', config);
};

export const updateFirstInitReady = (status) => {
  setGlobalState('firstInitReady', status);
};

export const updateInitModelSequenceReady = (status) => {
  setGlobalState('initModelSequenceReady', status);
};

export const updateBackendTerminalStreaming = (line) => {
  setGlobalState('backendTerminalStreaming', (oldEntries) => {
    const newArrObj = [...oldEntries];
    if (newArrObj.length > 100) {
      //Only store the last 100 lines of the terminal
      newArrObj.shift();
    }
    newArrObj.push(line);
    return newArrObj;
  });
};

export { useGlobalState };
