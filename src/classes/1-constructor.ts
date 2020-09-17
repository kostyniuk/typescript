class Greeting {
  greeting: string; // property

  constructor(message: string) {
    this.greeting = message; // this - member access
  } //constructor

  greet() {
    return 'Hello, ' + this.greeting;
  } // method
}

let greeterFriend = new Greeting('dear Friend');

console.log({ greet: greeterFriend.greet() });
