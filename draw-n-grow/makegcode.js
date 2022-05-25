
export function makegcode(outlines){
  let gcode = `
M140 S60
M104 T0 S0
M190 S60
G28
`;
  let e;
  for (let i = 0; i < outlines.length; i++){
    let z = i*2;
    gcode += `
G92 E0
G1 F3600 E-1
G1 X${outlines[i][0][0][0]} Y${outlines[i][0][0][1]} F3600
G1 Z${z} F3600
G1 E0 F3600
`;
    
    for (let j = 0; j < outlines[i].length; j++){
      if (j){ // perimeter change
      gcode += `
G92 E0
G1 F3600 E-1
G1 X${outlines[i][j][0][0]} Y${outlines[i][j][0][1]} F3600
G1 Z${z} F3600
G1 E0 F3600
`;
      }
      e = 0;
      for (let k = 1; k < outlines[i][j].length; k++){
        let [x,y] = outlines[i][j][k];
        let [x0,y0] = outlines[i][j][k-1];
        let d = Math.hypot(x-x0,y-y0);
        e += d * 1.27;
        gcode += `G1 X${x} Y${y} Z${z} E${e} ${(k==1)?"F900":""}\n`;
      }
    }
  }
  gcode +=`
G28
M84
M140 S0
M104 T0 S0
`;
  return gcode;

}
