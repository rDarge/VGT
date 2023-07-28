import React, { useRef, useState, useEffect } from 'react';
const { ipcRenderer } = require('electron');

const Capture = () => {
  useEffect(() => {
    console.log('Capture Loaded');
  }, []);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [endCoords, setEndCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(163, 163, 194, 0.4)'; // Set the background color to transparent blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(163, 163, 194, 0.4)'; // Set the background color to transparent blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(
      startCoords.x,
      startCoords.y,
      endCoords.x - startCoords.x,
      endCoords.y - startCoords.y,
    );

  }, [isDrawing, startCoords, endCoords]);

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
    await ipcRenderer.invoke('captureScreenshot');
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
