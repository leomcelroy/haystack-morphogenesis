function getPerimeter(line){
  let s = 0;
  for (let i = 1; i < line.length; i++){
    let [x0,y0,z0] = line[i-1];
    let [x1,y1,z1] = line[i];
    s += Math.sqrt( (x1-x0)**2 + (y1-y0)**2 + (z1-z0)**2 );
  }
  return s;
}


function getResampledBySpacing(p, spacing)  {
  if(spacing==0 || p.length == 0) return p.slice();
	let poly= [];
  let totalLength = getPerimeter(p);
  let f=0;
  for(f=0; f<=totalLength; f += spacing) {
    poly.push(getPointAtLength(p,f));
  }
  if( f != totalLength ){
    poly.push(p[p.length-1]);
  }
  return poly;
}


function getWrappedIndex(points,index) {
  if(!points.length) return 0;
  if(index < 0) return 0;
  if(index > points.length-1) return points.length - 1;
  return index;
}

function getInterpolationParams(points,findex)  {
  i1 = Math.floor(findex);
  t = findex - i1;
  i1 = getWrappedIndex(points,i1);
  i2 = getWrappedIndex(points,i1 + 1);
  // console.log(i1,i2,t)
  return [i1,i2,t];
}

function getPointAtIndexInterpolated(points, findex) {
  
	if(points.length < 2) return points.slice();
  let [i1, i2, t] = getInterpolationParams(points,findex);
  
	let leftPoint = points[i1];
	let rightPoint = points[i2];

	return [
    leftPoint[0] * (1-t) + rightPoint[0] * t,
    leftPoint[1] * (1-t) + rightPoint[1] * t,
    leftPoint[2] * (1-t) + rightPoint[2] * t,
  ]
}


function getPointAtLength(p,f) {
	if(p.length < 2) return p.slice();
  return getPointAtIndexInterpolated(p,getIndexAtLength(p,f));
}



function getIndexAtLength(points, length) {
  // console.log(',')
  let lengths = [0];
  let l = 0;
  for (let i = 1; i < points.length; i++){
    let p1 = points[i-1];
    let p2 = points[i];
    l += Math.hypot(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]);
    lengths.push(l);
  }

  if(points.length < 2) return 0;


  

  let totalLength = getPerimeter(points);


  let L = Math.min(Math.max(length, 0), totalLength);
  // console.log(L);
  for (let i = points.length-2; i>=0; i--){
    
    if (L >= lengths[i]){
      let t = (L-lengths[i])/(lengths[i+1]-lengths[i]);
      // console.log(i,t);
      return i+t;
    }
  }

  // let lastPointIndex = points.length-1;
  
  // let i1 = Math.min(Math.max(Math.floor(length / totalLength * lastPointIndex), 0), lengths.length-2);   // start approximation here
  // let leftLimit = 0;
  // let rightLimit = lastPointIndex;
  
  // let distAt1, distAt2;
  // for(let iterations = 0; iterations < 32; iterations ++) {	// limit iterations
  //     i1 = Math.min(Math.max(i1, 0), lengths.length-1);
  //     distAt1 = lengths[i1];
  //     if(distAt1 <= length) {         // if Length at i1 is less than desired Length (this is good)
  //         distAt2 = lengths[i1+1];
  //         // console.log(i1,lengths.slice(i1,i1+3),distAt1,length,distAt2);
  //         if(distAt2 >= length) {
  //             let t = (length-distAt1)/ (distAt2-distAt1);
  //             // let t = ofMap(length, distAt1, distAt2, 0, 1);
  //             console.log(i1,t);
  //             return i1 + t; 
  //         } else {
  //             leftLimit = i1;
  //         }
  //     } else {
  //         rightLimit = i1;
  //     }
  //     i1 = (leftLimit + rightLimit)/2;
  // }
  return 0;
}

// function getClosestPointUtil( p1,  p2,  p3, normalizedPosition) {
// 	// if p1 is coincident with p2, there is no line
// 	if(p1 == p2) {
// 		if(normalizedPosition != null) {
// 			normalizedPosition[0] = 0;
// 		}
// 		return p1;
// 	}
	
// 	let u = (p3[0] - p1[0]) * (p2[0] - p1[0]);
// 	u += (p3[1] - p1[1]) * (p2[1] - p1[1]);
// 	// perfect place for fast inverse sqrt...
//   let len = Math.hypot(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]);
// 	u /= (len * len);
	
// 	// clamp u
// 	if(u > 1) {
// 		u = 1;
// 	} else if(u < 0) {
// 		u = 0;
// 	}
// 	if(normalizedPosition != null) {
// 		normalizedPosition[0] = u;
// 	}
//   return [
//     p1[0] * (1-u) + p2[0] * u, 
//     p1[1] * (1-u) + p2[1] * u, 
//     p1[2] * (1-u) + p2[2] * u, 
//   ];
// }


// function getClosestPoint(p, target, nearestIndex) {
// 	polyline = p.slice();
    
// 	if(polyline.length < 2) {
// 		if(nearestIndex != nullptr) {
// 			nearestIndex[0] = 0;
// 		}
// 		return target;
// 	}
	
// 	let distance = 0;
// 	let nearestPoint = [0,0,0];
// 	let nearest = 0;
// 	let normalizedPosition = 0;
// 	let lastPosition = polyline.length - 1;

// 	for(let i = 0; i < ~~lastPosition; i++) {
// 		let repeatNext = i == ~~(polyline.length - 1);
		
// 		let cur = polyline[i];
// 		let next = repeatNext ? polyline[0] : polyline[i + 1];
		
// 		let curNormalizedPosition = [0];
// 	  let curNearestPoint = getClosestPointUtil(cur, next, target, curNormalizedPosition);
// 		let curDistance = Math.hypot(currNearestPoint[0]-target[0], currNearestPoint[1]-target[1], currNearestPoint[2]-target[2]);
    
// 		if(i == 0 || curDistance < distance) {
// 			distance = curDistance;
// 			nearest = i;
// 			nearestPoint = curNearestPoint;
// 			normalizedPosition = curNormalizedPosition[0];
// 		}
// 	}
	
// 	if(nearestIndex != null) {
// 		if(normalizedPosition > .5) {
// 			nearest++;
// 			if(nearest == polyline.length) {
// 				nearest = 0;
// 			}
// 		}
// 		nearestIndex[0] = nearest;
// 	}
	
// 	return nearestPoint;
// }
