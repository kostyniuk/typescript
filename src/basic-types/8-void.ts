const warnUser = (): void => {
  console.log('This is my warning message');
};

console.log({ result: warnUser() }); //By default it returns undefined
