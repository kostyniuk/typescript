export {};

const printInfo = (name: string, age = 18) => {
  console.log(`${name} ${age}`);
};

printInfo('Alex');
printInfo('Alex', 20);
