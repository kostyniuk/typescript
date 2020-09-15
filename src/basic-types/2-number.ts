let temperature = 100;

let decimal = 6;
let hex = 0xf00d;
let binary = 0b1010;
let octal = 0o744;
let big = 100n; //bigint

temperature = 120;

// temperature = 'hot'; //NOT WORKS - Type '"hot"' is not assignable to type 'number'
console.log({ temperature, big });
