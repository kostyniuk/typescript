//Sometimes you’ll end up in a situation where you’ll know more about a value than TypeScript does. Usually, this will happen when you know the type of some entity could be more specific than its current type.

let someValue: unknown = 'this is a string';

let strLength: number = (someValue as string).length;
