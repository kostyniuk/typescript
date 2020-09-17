// TypeScript supports getters/setters as a way of intercepting accesses to a member of an object.
// This gives you a way of having finer-grained control over how a member is accessed on each object.

/*
In this version, we add a setter that checks the length of the newName to make sure it’s compatible with the max-length of our backing database field. 
If it isn’t we throw an error notifying client code that something went wrong.

To preserve existing functionality, we also add a simple getter that retrieves fullName unmodified.
*/
const fullNameMaxLength = 10;

export {};

class Employee {
  private _fullName: string = '';

  get fullName(): string {
    return this._fullName;
  }

  // kinda like proxy. We don't give a complete access to our local variables
  set fullName(newName: string) {
    if (newName && newName.length > fullNameMaxLength) {
      throw new Error('fullName has a max length of ' + fullNameMaxLength);
    }

    this._fullName = newName;
  }
}

let employee = new Employee();
employee.fullName = 'Bob Smith';

if (employee.fullName) {
  console.log(employee.fullName);
}
