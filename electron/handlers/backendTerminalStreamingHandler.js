const { BrowserWindow } = require('electron');

function handleBackendTerminal(data) {
  let line = data.trim();

  //In case the line starts with "Downloading", we preprocess the text to format it for display on the frontend
  //This line is shown first
  //Currently this is done to report on the download status of the model
  if (line.includes('Downloading')) {
    let aux = line
      .replace('Downloading', '...')
      .replace(' ', '')
      .replace('(�)', '')
      .replace(/\|.*?\|/, '');
    aux = aux.split('[');
    aux = aux[0] + '[' + aux[1].split(',')[1].replace(' ', '');

    //Send the string to the frontend
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.title === 'Visual-GPT-Translator') {
        win.webContents.send('backendTerminalStreaming', aux);
      }
    });
  }
}

module.exports = {
  handleBackendTerminal,
};
