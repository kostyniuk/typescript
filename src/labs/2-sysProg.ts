let readline = require('readline');
const util = require('util');
readline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question[util.promisify.custom] = (question: string) => {
  return new Promise((resolve) => {
    readline.question(question, resolve);
  });
};

(async () => {

  let exit = false

  while (!exit) {
    const answer = await util.promisify(readline.question)('What is your name? ');

    switch (answer) {
      case 'exit':
        exit = true
        console.log('Exited the fs');
    }

  }

  readline.close();
})()
