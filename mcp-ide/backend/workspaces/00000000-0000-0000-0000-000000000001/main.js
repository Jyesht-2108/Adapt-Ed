import { sub } from "./new.js";
import { fibonacci } from "./utils.js";

const diff = sub(5, 7);
const fibSeq = fibonacci(7);

console.log("diff:", diff);
console.log("Fibonacci:", fibSeq);