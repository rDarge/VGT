const { spawn } = require('cross-spawn');
const {
  handleBackendTerminal,
} = require('../handlers/backendTerminalStreamingHandler');

let workers = [];

/**
 * Start and manage the Python backend
 */
async function initBackend() {
  if (process.env.NODE_ENV === 'development') {
    //If we use uvicorn we must run python like this but we need to run "poetry shell" manually before we can wokr on the project
    const pythonProcess = spawn('python', ['./backend/main.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    //We can use poetry here if Hypercorn is used in the back. This ensures that processes die at the appropriate times.
    /*
    const pythonProcess = spawn(
      'poetry',
      ['run', 'python', './backend/main.py'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false 
      },
    );
    */
    workers.push(pythonProcess);
  } else {
    const pythonProcess = spawn('./backend/mangaOcrApi/mangaOcrApi.exe', {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });
    //TODO: Investigate how this works in prod
    workers.push(pythonProcess);
  }

  workers[0].stdout.on('data', (outdata) => {
    const data = outdata.toString();
    console.log(data);
    handleBackendTerminal(data); //Pass the string of characters to be sent to the front if necessary
  });
  workers[0].stderr.on('data', (outdata) => {
    const data = outdata.toString();
    console.log(data);
    handleBackendTerminal(data); //Pass the string of characters to be sent to the front if necessary
  });
  workers[0].on('error', (err) => {
    console.log('on error');
    console.log('child launch failed: ', err);
  });
  workers[0].on('close', (code) => {
    console.log('on close');
    console.log('child ended: ', code);
  });
  workers[0].on('exit', (code) => {
    console.log('on exit');
    console.log('child exit: ', code);
  });
}

module.exports = {
  initBackend,
};
