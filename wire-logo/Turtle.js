
export class Turtle {




  constructor() {
    this.path = [
      [0, 0, 0]
    ];
    this.angle_lr = 0;
    this.angle_ud = 0;

    this.mat = new THREE.Matrix4().identity();
  }

  get pos() {
    return this.path.at(-1);
  }

  forward(distance) {

    // const angle_lr_rad = this.angle_lr/180*Math.PI;
    // const angle_ud_rad = this.angle_ud/180*Math.PI;

    // const [ x, y, z ] = this.pos;
    // const newX = x + distance*Math.cos(angle_lr_rad)*Math.cos(angle_ud_rad);
    // const newY = y + distance*Math.sin(angle_lr_rad)*Math.cos(angle_ud_rad); 
    // const newZ = z + distance*Math.sin(angle_ud_rad);

    // const pt = [ newX, newY, newZ ];

    // this.path.push(pt);

    let d = new THREE.Vector3(0,0,distance).applyMatrix4(this.mat);
    const [ x, y, z ] = this.pos;
    let pt = [x+d.x,y+d.y,z+d.z];
    this.path.push(pt);

    return this;
  }

  up(angle) {
    this.mat.multiply(new THREE.Matrix4().makeRotationX(angle/180*Math.PI));
    // this.angle_ud += angle;
    return this;
  }

  down(angle) {
    this.mat.multiply(new THREE.Matrix4().makeRotationX(-angle/180*Math.PI));
    // this.angle_ud -= angle;
    return this;
  }

  left(angle) {
    this.mat.multiply(new THREE.Matrix4().makeRotationY(-angle/180*Math.PI));
    // this.angle_lr += angle;
    return this;
  }

  right(angle) {
    this.mat.multiply(new THREE.Matrix4().makeRotationY(angle/180*Math.PI));
    // this.angle_lr += angle;
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

