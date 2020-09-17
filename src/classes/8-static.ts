/*
Up to this point, we’ve only talked about the instance members of the class, 
those that show up on the object when it’s instantiated. We can also create static members of a class,
those that are visible on the class itself rather than on the instances. 
In this example, we use static on the origin, as it’s a general value for all grids. 
Each instance accesses this value through prepending the name of the class. 
Similarly to prepending this. in front of instance accesses, here we prepend Grid. in front of static accesses.

Static properties are not visible through this keyword
*/

class Grid {
  static origin = { x: 0, y: 0 };

  calculateDistanceFromOrigin(point: { x: number; y: number }) {
    let xDist = point.x - Grid.origin.x;
    let yDist = point.y - Grid.origin.y;
    return Math.sqrt(xDist * xDist + yDist * yDist) / this.scale;
  }

  constructor(public scale: number) {}
}

let grid1 = new Grid(1.0); // 1x scale
let grid2 = new Grid(5.0); // 5x scale

console.log(grid1.calculateDistanceFromOrigin({ x: 10, y: 10 }));
console.log(grid2.calculateDistanceFromOrigin({ x: 10, y: 10 }));
