let commands = [
  "forward","left","right","up","down","goTo","setHeading",
]
let keywords = [
  "make","for","as","do","end","if","then","else"
].concat(commands);

export function parse(txt){
  let words = txt.replace(/\n/g," ").split(" ").filter(x=>x.length);

  function _parse(words){
    
    let A = [];
    let i = 0;
    while (i < words.length){

      function readstuff(){
        let o = [];
        while ( !keywords.includes(words[i])){
          o.push(words[i]);
          i++;
          if (i >= words.length){
            break;
          }
        }
        return o.join(' ');
      }
      if (commands.includes(words[i])){
        let f = words[i++];
        let a = readstuff();
        A.push(["cmd", f, a]);
      }else if (words[i] == 'make'){
        i++;
        let f = words[i++];
        let a = readstuff();
        A.push(['var',f,a])
      }else if (words[i] == 'if'){
        i++;
        let a = readstuff();
        let j = i;
        let lvl = 0;
 
        while (1){
          if (!words[j]){
            process.exit();
          }
          if (words[j] == 'do' || words[j] == 'then'){
            lvl ++;
          }else if (words[j] == 'end' || words[j] == 'else'){
            lvl --;
            if (lvl == 0){
              break;
            }
          }
          j++;
        }
        let block = words.slice(i+1,j);
        let p = _parse(block);

        let q = null;
        i = j;
        if (words[i] == 'else'){
          let j = i+1;
          let lvl = 1;
          while (1){
            if (words[j] == 'do' || words[j] == 'then'){
              lvl ++;
            }else if (words[j] == 'end'){
              lvl --;
              if (lvl == 0){
                break;
              }
            }
            j++;
          }
          let block = words.slice(i+1,j);
          q = _parse(block);
          i = j+1;
        }
        A.push(['if',a,p,q]);
        
      }else if (words[i] == 'for'){
        i++;
        let a = readstuff();
        i++;
        let b = words[i];
        let j = i+1;
        let lvl = 0;
        while (1){
          if (words[j] == 'do' || words[j] == 'then'){
            lvl ++;
          }else if (words[j] == 'end'){
            lvl --;
            if (lvl == 0){
              break;
            }
          }
          j++;
        }
        let block = words.slice(i+2,j);
        A.push(['for',a,b,_parse(block)]);
        i = j;
      }else{
        i++;
      }
    }
    return A;
  }
  return _parse(words);
}

export function to_js(A){
  let js = ``;
  for (let i = 0; i < A.length; i++){
    if (A[i][0] == 'cmd'){
      js += `turtle.${A[i][1]}(${A[i][2]});\n`;
    }else if (A[i][0] == 'if'){
      js += `if (${A[i][1]}){\n${to_js(A[i][2])}}\n`
      if (A[i][3]){
        js += `else{\n${to_js(A[i][3])}}\n`
      }
    }else if (A[i][0] == 'for'){
      js += `for (let ${A[i][2]} = 0; ${A[i][2]} < ${A[i][1]}; ${A[i][2]}++){\n${to_js(A[i][3])}}\n`;
    }else if (A[i][0] == 'var'){
      js += `let ${A[i][1]} = ${A[i][2]};\n`
    }
  }
  return js;
}


// let A = parse(`
// forward 10
// left 20 * 4
// forward 30
// setHeading 10, 20
// if 1== 2 then 
//   forward 40 
//   forward 2
// else 
//   goTo 50, 60, 70
// end
// make a 3
// forward a + 3
// for 10 as i do
//   forward i
//   left 20
//   if 1 <= 3 then 
//     left 5
//   end
// end
// `)
// console.dir(A,{depth:null});
// console.log(to_js(A))
