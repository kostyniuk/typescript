//Tuple types allow you to express an array with a fixed number of elements whose types are known, but need not be the same. For example, you may want to represent a value as a pair of a string and a number:

let pair: [string, number];

pair = ['price', 15];

//pair = ['price', false]; // NOT WORKS

console.log({ pair });
