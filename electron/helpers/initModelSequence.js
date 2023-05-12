const { BrowserWindow } = require('electron');
const axios = require('axios');
const { setInitModelSequenceReady } = require('./config');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function checkBackend() {
  let failCount = 0;
  while (failCount < 10) {
    try {
      const res = await axios.get('http://localhost:8000/check');
      if (res.status === 200) {
        return;
      }
      failCount++;
      await sleep(500);
    } catch (e) {
      failCount++;
      await sleep(500);
    }
  }
  console.log('Error conectando con el backend');
  process.exit();
}

async function checkModelStatus() {
  try {
    let res = await axios.get('http://localhost:8000/modelCheck'); //TODO: Dejar de usar check para validar estado de back y usar este para reducir tiempo de inicio
    if (res.status === 200) {
      //Si esta en disco realizamos el POST pero **sin** await, ya que el proceso de carga en memoria es bien rápido y no queremos repentizar mas al usuario
      if (res.data === 'inDisk') {
        axios
          .post(
            'http://localhost:8000/loadMangaOCR',
            {},
            { timeout: 60000 * 1 },
          )
          .then((res) => {
            if (res.status !== 200) {
              process.exit();
            }
          });
        initModelSequenceReady(); //Consideramos el proceso inmediatamente terminado
        return;
      } else {
        //En caso que no este en disco, lo descargamos. Aquí si usamos await, ya que es un proceso lento y queremos evitar que el usuario pueda usar el sistema si esto no esta listo
        axios
          .post(
            'http://localhost:8000/loadMangaOCR',
            {},
            { timeout: 60000 * 5 },
          )
          .then((res) => {
            if (res.status !== 200) {
              process.exit();
            } else {
              initModelSequenceReady(); //Usamos un .then para terminar el proceso solo cuando la request esta lista
            }
          });
        return;
      }
    }
  } catch (e) {
    console.log('Error con peticiones para cargar modelo inicial', e);
  }
  process.exit();
}

function initModelSequenceReady() {
  //Send the ready sequence signal to the frontend
  setInitModelSequenceReady(true);
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.title === 'Visual-GPT-Translator') {
      win.webContents.send('initModelSequenceReady');
    }
  });
}

/**
 * This initial sequence checks to see if the backend has already downladed the MangaOCR model.
 * 1. A loading modal is displayed on the frontend
 * 2. Attempt to connect to the backend (close after repeated failures)
 * 3. Wait for the backend to finish download the model
 */
async function initModelSequence() {
  setInitModelSequenceReady(false); //Display a loading modal in the frontend
  await checkBackend(); 
  await checkModelStatus();
}

module.exports = { initModelSequence };
