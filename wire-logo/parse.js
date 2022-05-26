import { comb } from "./comb.js";

const skip = ["ws"];
const literals = ["do", "end", "for", "as"];

const tokenRules = {
  word: /[a-zA-Z]+/,
  number: /-?[0-9]+/,
  ws: /[^\S\r\n]+/,
  newline: /\n+/,
  singleQuote: "'",
  literal: literals,
}

const parse = ()=>{};
// body line could be implicit quote if only one item

export { parse };
