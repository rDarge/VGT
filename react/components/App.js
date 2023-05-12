const { ipcRenderer } = require('electron');
import React, { useEffect } from 'react';
import Main from './Main';
import {
  addNewEntry,
  addText,
  addTrad,
  updateConfig,
  deleteEntry,
  updateFirstInitReady,
  updateInitModelSequenceReady,
  updateBackendTerminalStreaming,
} from './state';

const App = () => {
  //Main to React event bridge
  useEffect(() => {
    //When there is a new entry (image) received in the main thread
    ipcRenderer.on('newEntry', (e, newEntry) => {
      addNewEntry(newEntry);
    });
    //When an entry is deleted
    ipcRenderer.on('entryDeleted', (e, entryId) => {
      deleteEntry(entryId);
    });
    //When the main thread has detected text for an image
    ipcRenderer.on('addText', (e, newText) => {
      addText(newText);
    });
    //When the main thread has a new translation ready
    ipcRenderer.on('addTrad', (e, newTrad) => {
      addTrad(newTrad);
    });
    //When the main thread has changed the saved settings
    ipcRenderer.on('refreshConfig', (e, config) => {
      updateConfig(config);
    });
    //When the main thread has notified us that the model is loaded
    ipcRenderer.on('initModelSequenceReady', (e) => {
      updateInitModelSequenceReady(true);
    });
    //When the main thread wants to transmit data to the backend, those lines flow through here
    ipcRenderer.on('backendTerminalStreaming', (e, line) => {
      updateBackendTerminalStreaming(line);
    });

    //In the beginning we will see if the main thread has already performed the initial model check
    async function getInitModelSequenceReady() {
      const initModelSequenceReady = await ipcRenderer.invoke(
        'getInitModelSequenceReady',
      );
      updateInitModelSequenceReady(initModelSequenceReady);
    }
    getInitModelSequenceReady();

    //When starting we make sure to load the configurations from the main thread
    async function syncConfig() {
      const currentConfig = await ipcRenderer.invoke('getConfig');
      updateConfig(currentConfig);
    }
    syncConfig();

    //When starting we check to see if we are ready before the main thread 
    async function getFirstInitReady() {
      const firstInitReady = await ipcRenderer.invoke('getFirstInitReady');
      updateFirstInitReady(firstInitReady);
    }
    getFirstInitReady();
  }, []);

  return <Main />;
};

export default App;
