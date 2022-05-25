
export class PolylineCurve3 extends THREE.Curve {

  constructor( vs ) {

    super();

    this.type = 'PolylineCurve3';
    this.isPolylineCurve3 = true;

    this.vs = vs;
    this.ls = [0];
    this.l = 0;
    for (let i = 1; i < vs.length; i++){
      this.l += vs[i].distanceTo(vs[i-1]);
      this.ls.push(this.l);
    }
    for (let i = 0; i < this.ls.length; i++){
      this.ls[i]/=this.l;
    }

  }
  getPoint( t, optionalTarget = new THREE.Vector3() ) {

    const point = optionalTarget;
    t = Math.min(Math.max(t,0),1);


    if ( t === 1 ) {

      point.copy( this.vs[this.vs.length-1] );

    } else {

      for (let i = this.ls.length-2; i >= 0; i--){
        if (t >= this.ls[i]){
          let a = this.vs[i];
          let b = this.vs[i+1];
          let frac = (t - this.ls[i]) / (this.ls[i+1]-this.ls[i]);
          point.copy( a.clone().multiplyScalar(1-frac).add(b.clone().multiplyScalar(frac)) );

          // console.log(t,i,a,b,frac,point);
          break;
        }
      }

    }
    

    return point;

  }

  getPointAt( t, optionalTarget = new THREE.Vector3() ) {

    const point = optionalTarget;
    t = Math.min(Math.max(t,0),1);


    if ( t === 1 ) {

      point.copy( this.vs[this.vs.length-1] );

    } else {

      for (let i = this.ls.length-2; i >= 0; i--){
        if (t >= this.ls[i]){
          let a = this.vs[i];
          let b = this.vs[i+1];
          let frac = (t - this.ls[i]) / (this.ls[i+1]-this.ls[i]);
          point.copy( a.clone().multiplyScalar(1-frac).add(b.clone().multiplyScalar(frac)) );

          // console.log(t,i,a,b,frac,point);
          break;
        }
      }

    }
    

    return point;

  }
}