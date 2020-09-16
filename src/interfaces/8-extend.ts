//An interface can extend multiple interfaces, creating a combination of all of the interfaces.

interface Shape {
  color: string;
}

interface PenStroke {
  penWidth: number;
}

interface Square extends Shape, PenStroke {
  sideLength: number;
}

let square = {} as Square;
square.color = 'blue';
square.sideLength = 10;
square.penWidth = 5.0;