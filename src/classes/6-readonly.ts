class Octopus {
  readonly name: string;
  readonly numberOfLegs: number = 8;

  constructor(theName: string) {
    this.name = theName;
  }
}

// OR (IT'S THE SAME)

// class Octopus {
//   readonly numberOfLegs: number = 8;
//   constructor(readonly name: string) {} // SHORTENED FORM
// }

let dad = new Octopus('Man with the 8 strong legs');
// dad.name = "Man with the 3-piece suit";
