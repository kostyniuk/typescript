//THERE CAN BE NO CONSTRUCTOR IN A CLASS

export {};

class Animal {
  move(distanceInMeters: number = 0) {
    console.log(`Animal moved ${distanceInMeters}m.`);
  }
}

class Dog extends Animal {
  bark() {
    console.log('Woof! Woof!');
  }
}

// const animal = new Animal();
// animal.bark() // WON'T WORK AS BARK METHOD ISN'T IMPLEMENTED IN THE ANIMAL CLASS

const dog = new Dog();
dog.bark();
dog.move(10);
dog.bark();
