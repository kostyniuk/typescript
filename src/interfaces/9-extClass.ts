class Control {
  private state: any;
  printState(): void {
    console.log(this.state);
  }
}

interface SelectableControl extends Control {
  select(): void;
}

class Button extends Control implements SelectableControl {
  select() {}
}

class TextBox extends Control {
  select() {}
}

// WON'T WORK as state has already been declared
/*
In the above example, SelectableControl contains all of the members of Control, including the private state property. 
Since state is a private member it is only possible for descendants of Control to implement SelectableControl. 
This is because only descendants of Control will have a state private member that originates in the same declaration, 
which is a requirement for private members to be compatible.

Within the Control class it is possible to access the state private member through an instance of SelectableControl. 
Effectively, a SelectableControl acts like a Control that is known to have a select method. 
The Button and TextBox classes are subtypes of SelectableControl (because they both inherit from Control and have a select method). 
The ImageControl class has it’s own state private member rather than extending Control, so it cannot implement SelectableControl.
*/
// class ImageControl implements SelectableControl {
//   private state: any;
//   select() {}
// }
