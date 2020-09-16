interface SearchFunc {
  (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;

// Can be also like this
// mySearch = (src, sub) => {...}

mySearch = (src: string, sub: string): boolean => {
  let result = src.search(sub);
  return result > -1;
};

console.log({
  searchA: mySearch("Hey, we're searching for the A letter", 'A'),
});

console.log({
  searchA: mySearch("Hey, we're searching for the A letter", 'B'),
});
