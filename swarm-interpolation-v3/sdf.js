const INF = 1e20;

export function sdf(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const size = width*height;
  const input = imageData.data
  const grid = new Float32Array(size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const r = input[i*4];
      const g = input[i*4 + 1];
      const b = input[i*4 + 2];
      const a = input[i*4 + 3];
      const grey = (r+g+b)/(255*3);
      grid[i] = grey === 1 ? 0 
        : grey === 0 ? INF 
        : Math.pow(Math.max(0, 0.5 - grey), 2);
    }
  }

  const maxDim = Math.max(width, height)
  const f = new Float32Array(maxDim);
  const z = new Float32Array(maxDim + 1);
  const v = new Uint16Array(maxDim);

  for (let x = 0; x < width; x++) edt1d(grid, x, width, height, f, v, z);
  for (let y = 0; y < height; y++) edt1d(grid, y * width, 1, width, f, v, z);
  // edt(output, 0, 0, width, height, 1, f, v, z);
  
  return grid;
}

// 1D squared distance transform
function edt1d(grid, offset, stride, length, f, v, z) {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride];

  for (let q = 1, k = 0, s = 0; q < length; q++) {
    do {
      const r = v[k];
      s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
    } while (s <= z[k--]);

    k += 2;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }

  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    grid[offset + q * stride] = f[r] + (q - r) * (q - r);
  }
}