export function drawPPMOnCanvas(ppm, canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width  = ppm.width;
  canvas.height = ppm.height;
  const imgData = new ImageData(ppm.data, ppm.width, ppm.height);
  ctx.putImageData(imgData, 0, 0);
}