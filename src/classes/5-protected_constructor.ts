// A constructor may also be marked protected. This means that the class cannot be instantiated outside of its containing class, but can be extended.

export {};

class Person {
  protected name: string;
  protected constructor(theName: string) {
    this.name = theName;
  }
}

// Employee can extend Person
class Employee extends Person {
  private department: string;

  constructor(name: string, department: string) {
    super(name);
    this.department = department;
  }

  public getElevatorPitch() {
    return `Hello, my name is ${this.name} and I work in ${this.department}.`;
  }
}

let howard = new Employee('Howard', 'Sales');
console.log({ howard });
// let john = new Person("John"); WON'T WORK AS Person's constructor is protected
