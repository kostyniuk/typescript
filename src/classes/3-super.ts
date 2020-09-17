class Animal {
  name: string;
  constructor(theName: string) {
    this.name = theName;
  }
  move(distanceInMeters: number = 0) {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}

class Snake extends Animal {
  //name is accessible here
  constructor(name: string) {
    super(name); // super executes the constructor of the base class
  }
  //overriding methods in the base class with methods that are specialized for the subclass
  move(distanceInMeters = 5) {
    console.log('Slithering...');
    super.move(distanceInMeters); // executing the method of a base class
  }
}

class Horse extends Animal {
  constructor(name: string) {
    super(name);
  }
  move(distanceInMeters = 45) {
    console.log('Galloping...');
    super.move(distanceInMeters);
  }
}

let sam = new Snake('Sammy the Python');
let tom = new Horse('Tommy the Palomino');

sam.move();
tom.move(34);
