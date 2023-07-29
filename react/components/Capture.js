import React, { useRef, useState, useEffect } from 'react';
const { ipcRenderer } = require('electron');

const actorColors = {
  null: 'rgba(163, 163, 194, 0.4)',
  1: 'rgba(15, 165, 219, 0.4)',
  2: 'rgba(219, 212, 15, 0.4)',
  3: 'rgba(219, 141, 15, 0.4)',
  4: 'rgba(219, 46, 15, 0.4)',
  5: 'rgba(107, 15, 219, 0.4)',
  6: 'rgba(182, 15, 219, 0.4)',
  7: 'rgba(219, 15, 175, 0.4)',
  8: 'rgba(219, 15, 90, 0.4)',  
  9: 'rgba(35, 15, 219, 0.4)',  
  0: 'rgba(15, 219, 171, 0.4)',
}

const Capture = () => {
  useEffect(() => {
    console.log('Capture Loaded');
  }, []);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [endCoords, setEndCoords] = useState({ x: 0, y: 0 });
  const [actorId, setActorId] = useState(null);

  

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = actorColors[actorId];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = actorColors[actorId];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(
      startCoords.x,
      startCoords.y,
      endCoords.x - startCoords.x,
      endCoords.y - startCoords.y,
    );

  }, [isDrawing, startCoords, endCoords, actorId]);

  function handleKeyPress (event) { 
    console.log("key ", event.key);
    ["0","1","2","3","4","5","6","7","8","9"].forEach(n => {
      if(event.key === n) {
        setActorId(event.key);
      }
    });
  }
  window.addEventListener('keyup', handleKeyPress, true)

  async function handleMouseDown(event) {
    ipcRenderer.send('event/mousedown');

    setIsDrawing(true);
    setStartCoords({
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    });
    setEndCoords({
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    });
  }

  //TODO: If the mouse leaves the range of the canvas (to another screen or the navbar) we must stop the capture process
  function handleMouseMove(event) {
    if (!isDrawing) return;
    setEndCoords({
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    });
  }

  const handleMouseUp = async () => {
    ipcRenderer.send('event/mouseup');
    setIsDrawing(false);
    await ipcRenderer.invoke('captureScreenshot', actorId);
    setStartCoords({x: 0, y: 0});
    setEndCoords({x: 0, y: 0});
  };

  return (
    <div
      style={{
        height: '100vh',
        position: 'absolute',
        width: '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default Capture;
