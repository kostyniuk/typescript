/*
Abstract classes are base classes from which other classes may be derived. 
They may not be instantiated directly. 
Unlike an interface, an abstract class may contain implementation details for its members. 
The abstract keyword is used to define abstract classes as well as abstract methods within an abstract class.

Methods within an abstract class that are marked as abstract do not contain an implementation and must be implemented in derived classes. 
Abstract methods share a similar syntax to interface methods. Both define the signature of a method without including a method body. 
However, abstract methods must include the abstract keyword and may optionally include access modifiers.
*/

abstract class Department {
  constructor(public name: string) {}

  printName(): void {
    console.log('Department name: ' + this.name);
  }

  abstract printMeeting(): void; // must be implemented in derived classes
}

class AccountingDepartment extends Department {
  constructor() {
    super('Accounting and Auditing'); // constructors in derived classes must call super()
  }

  printMeeting(): void {
    console.log('The Accounting Department meets each Monday at 10am.');
  }

  generateReports(): void {
    console.log('Generating accounting reports...');
  }
}

let department: Department; // ok to create a reference to an abstract type
// department = new Department(); // error: cannot create an instance of an abstract class
department = new AccountingDepartment(); // ok to create and assign a non-abstract subclass
department.printName();
department.printMeeting();
// department.generateReports();
// Property 'generateReports' does not exist on type 'Department'.
