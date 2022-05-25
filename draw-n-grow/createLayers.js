export const createLayers = scene => paths => {
  const curves = [];
  const layerHeight = .02;

  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i];
    
    const lines = [];

    for (let j = 1; j < path.length; j += 1) {
      let last = path[j-1];
      let cur = path[j];
      const scaleDown = [70, 70];
      last = [last[0]/scaleDown[0] - 3.5, last[1]/scaleDown[1] - 5];
      cur = [cur[0]/scaleDown[0] - 3.5, cur[1]/scaleDown[1] - 5];
      const v0 = new THREE.Vector3(last[0], i*layerHeight, last[1]);
      const v1 = new THREE.Vector3(cur[0], i*layerHeight, cur[1]);
      const lineCurve = new THREE.LineCurve3(v0, v1);
      lines.push(lineCurve);
    }

    const curve = new THREE.CurvePath();
    curve.curves.push(...lines);

    const geometry = new THREE.TubeGeometry(curve, 5000, .02);
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    curves.push(mesh);
  }

  console.log(curves);

  curves.forEach(x => scene.add(x));
}