import { comb } from "./comb.js";
import { Turtle } from "./Turtle.js";

const KEYWORDS = [
  "make", 
  "BREAK", 
  "for", 
  "forward", 
  "left", 
  "right", 
  "up", 
  "down", 
  "goTo", 
  "setHeading",
  "if",
  "then",
  "else",
  "do",
  "end",
  "as",
];
const JOIN = ["+", "-", "/", "*", "%", "==", "!=", "<", ">", "<=", ">="];


function tokenize(string) {
  const tokens = string.trim().replaceAll("\n", " BREAK ").split(/[ ]+/);
  const result = [];
  let curStr = "";

  for (let i = 0; i < tokens.length; i++) {
    const cur = tokens[i];
    let next = tokens[i+1];
    if (next === undefined) next = "";
    if (KEYWORDS.includes(cur)) {
      result.push({ type: cur, value: cur });
    } else if (JOIN.includes(next) || JOIN.includes(cur)) {
      curStr += cur;
    } else {
      curStr += cur;
      result.push({ type: "js", value: curStr });
      curStr = "";
    }

  }

  console.log(result);

  return result;
}

const parse = comb`
lexer ${tokenize}

js = 'js'
js -> ${x => ["js", x.value]}

cmds = 'make' 
  | 'forward' 
  | 'left' 
  | 'right' 
  | 'up' 
  | 'down' 
  | 'setHeading' 
  | 'goTo'
cmd = cmds js* 'BREAK'?
cmd -> ${x => [x[0].value, ...x[1]]}

do = 'do' block 'end' 
do -> ${ x => ["do", x[1]]}

for = 'for' js 'as' js do
for -> ${ x => ["for", x[1], x[3], x[4] ] }

if = 'if' js 'then' js 'else' js
if -> ${ x => ["if", x[1], x[3], x[5]] }

line = cmd | for | if | 'BREAK'

block = line*
block -> ${ x => x.filter( x => x.type !== "BREAK")}

block
`

const funcs = {
  "for": (...args) => {
    console.log();
  },
  "if": () => {},
  "make": () => {},
  "do": (...args) => {  
    return evaluate(args[0]);
  },
  "doMap": (...args) => {
    return args.map(evaluate);
  },
  "forward": (...args) => {
    console.log("forward", args);
  },
  "up": () => {},
  "down": () => {},
  "left": () => {},
  "right": () => {},
  "goTo": () => {},
  "setHeading": () => {},
  "js": () => {

  }
}

const evaluate = (node) => {
  if (Array.isArray(node)) {
    const [ head, ...tail ] = node;

    if (head === "quote" || head === undefined) return tail[0];
    if (!(head in funcs)) console.error("Unknown call:", head);
    if (head === "doMap") {
      console.log("tail", tail);
      return tail.map(evaluate);
    }
    const func = funcs[head];

    const args = [];
    for (const val of tail) {
      const evalVal = evaluate(val);
      args.push(evalVal);
    }

    return func(...args);

  } else {
    return node;
  }
}

const t = new Turtle();

// console.log(t.path);
// forward 9+32 32+32
// left 32
// right 32
// up 49
// down 32
// goTo 23
// make "a" 10
// if 10 == 32 then 21 else 21
// for 10 as i do
//   forward 32
// end
const prog = `
forward 90
`
const ast = [ "doMap", parse(prog) ];
console.log("ast", ast);
const value = evaluate(ast);

export { parse, evaluate };
