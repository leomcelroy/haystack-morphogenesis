import { parse } from "./parse.js";

const walk = (node, replacements)  => {
  if (Array.isArray(node)) return node.map(n => walk(n, replacements));
  else if (`${node}` in replacements) return replacements[`${node}`];
  else return node;
}

const createEval = turtle => { // continuation, higher-order function
  const funcs = {
    repeat: function* (...args) {
      const [ num, iterator, block ] = args;

      for (let i = 0; i < num; i++) {
        yield* funcs["run"](block);
        yield;
      }
    },
    print: function (...args) { 
      return args.map(x => { console.log(x); return x; });
    },
    forward: function (distance) { 
      return turtle.forward(distance);
    },
    right: function (angle) { 
      return turtle.right(angle);
    },
    left: function (angle) { 
      return turtle.left(angle);
    },
    up: function (angle) { 
      return turtle.up(angle);
    },
    down: function (angle) { 
      return turtle.down(angle);
    },
    goTo: function (x, y, z) { 
      return turtle.goTo(x, y, z);
    },
  }

  const yielders = [];

  function* evaluate(node) {
    if (Array.isArray(node)) {
      const [ head, ...tail ] = node;
      if (head === "quote" || head === undefined) return tail[0];

      if (!(head in funcs)) console.error("Unknown function:", head);

      const func = funcs[head];

      const args = [];
      for (const val of tail) {
        const evalVal = yield* evaluate(val);
        args.push(evalVal);
      }

      const val = func(...args);

      return yielders.includes(head) 
        ? yield* val
        : val

    } else {
      return node;
    }
  };

  return evaluate;
}


export const run = (string, turtle) => {
  const ast = parse(string);

  console.log("ast", ast);

  // const prog = createEval(turtle)([ "run", ast ]);

  // return prog;
}