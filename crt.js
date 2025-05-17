const crtCanvas = document.getElementById('crtOverlay');
const crtCtx = crtCanvas.getContext('2d');
let scanLineY = 0;
let lastTime = 0;

function drawCRT(deltaTime) {
    // Czyszczenie canvasu
    crtCtx.clearRect(0, 0, crtCanvas.width, crtCanvas.height);

    // Szum
    const imageData = crtCtx.createImageData(crtCanvas.width, crtCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = Math.random() * 50; // Subtelny szum
        imageData.data[i] = noise;     // R
        imageData.data[i + 1] = noise; // G
        imageData.data[i + 2] = noise; // B
        imageData.data[i + 3] = 5;     // Alpha (bardzo przezroczysty)
    }
    crtCtx.putImageData(imageData, 0, 0);

    // Linie skanowania
    scanLineY += deltaTime / 1000 * 100; // Prędkość: 100px/s
    if (scanLineY > crtCanvas.height) scanLineY = 0; // Reset na górze
    crtCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    crtCtx.fillRect(0, scanLineY, crtCanvas.width, 2); // Linia 2px

    console.log(`CRT effect: scanLineY=${scanLineY}, deltaTime=${deltaTime}`);
}

function crtLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    drawCRT(deltaTime);
    requestAnimationFrame(crtLoop);
}

requestAnimationFrame(crtLoop);
