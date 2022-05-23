export const shade = (distances, width, height, max, min) => {
  //TODO: this width and height should be passed properly
  var w = width;
  var h = height;
  var output = new Uint8ClampedArray(4 * h * w);
  const maxDistance = Math.sqrt(width**2 + height**2);
  for (var row = 0; row < h; ++row) {
    for (var col = 0; col < w; ++col) {
      const d = distances[(h - 1 - row) * w + col];
      const bw = d < 0 ? 255 : 0;
      // output[(h - 1 - row) * w * 4 + col * 4 + 0] = bw; // d < 0 ? (d/min*255) : 0;
      // output[(h - 1 - row) * w * 4 + col * 4 + 1] = bw;
      // output[(h - 1 - row) * w * 4 + col * 4 + 2] = bw; //d > 0 ? (d/max*255) : 0;
      // output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;

      output[(h - 1 - row) * w * 4 + col * 4 + 0] = d < 0 ? (d/min*255) : 0;
      output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
      output[(h - 1 - row) * w * 4 + col * 4 + 2] = d > 0 ? (d/max*255) : 0;
      output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
  }

  const imgData = new ImageData(output, w, h);

  return imgData;
};