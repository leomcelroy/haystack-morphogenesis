export class Turtle {
  constructor() {
    this.path = [
      [0, 0, 0]
    ];
    this.angle_lr = 0;
    this.angle_ud = 0;
  }

  get pos() {
    return this.path.at(-1);
  }

  forward(distance) {

    const angle_lr_rad = this.angle_lr/180*Math.PI;
    const angle_ud_rad = this.angle_ud/180*Math.PI;

    const [ x, y, z ] = this.pos;

    const newX = x + distance*Math.cos(angle_lr_rad)*Math.cos(angle_ud_rad);
    const newY = y + distance*Math.sin(angle_lr_rad)*Math.cos(angle_ud_rad); 
    const newZ = z + distance*Math.sin(angle_ud_rad);

    const pt = [ newX, newY, newZ ];

    this.path.push(pt);

    return this;
  }

  up(angle) {
    this.angle_ud += angle;
    return this;
  }

  down(angle) {
    this.angle_ud -= angle;
    return this;
  }

  left(angle) {
    this.angle_lr += angle;
    return this;
  }

  right(angle) {
    this.angle_lr += angle;
    return this;
  }

  goTo(x, y, z) {
    this.path.push([x, y, z]);
    return this;
  }

  setHeading(angle_lr, angle_ud) {
    this.angle_lr = angle_lr;
    this.angle_ud = angle_ud;

    return this;
  }
}

function linear(a, u, b, v) {
  // Return linear combination of u and v
  // Requires: u, v are vectors, a is a number
  // Ensures: result = a * u + b * v
  var result = [ ];
  for (var c = x; c <= z; ++c) {
    result[c] = a * u[c] + b * v[c];
  }
  return result;
}

function cross(u, v) {
  // Return cross product of u and v
  // Requires: u, v are vectors
  // Ensures: result = cross product of u and v
  var result = [ ];
  for (var c = x; c <= z; ++c) {
    result[c] = u[(c+1)%3] * v[(c+2)%3] - u[(c+2)%3] * v[(c+1)%3];
  }
  return result;
}

function rotateNormal(u, v, w, alpha) {
  // Return rotation of u in direction of v about w over alpha
  // Requires: u, v, w are vectors; alpha is angle in radians
  //   u, v, w are orthonormal
  // Ensures: result = u rotated in direction of v about w over alpha
  return linear(Math.cos(alpha), u, Math.sin(alpha), v);
}


