// Some properties should only be modifiable when an object is first created. You can specify this by putting readonly before the name of the property

export {};

interface Person {
  username: string;
  fullname: string;
  age: number;
  readonly bornAt: number;
}

const loguser = (person: Person): string => {
  let { username, fullname, age, bornAt } = person;

  username = 'default'; // works as username isn't readonly
  // person.bornAt = 1990; // doesn't works as it's readonly

  return `@${username} is ${fullname} and he/she is ${age} years old(born at ${bornAt})`;
};

console.log(
  loguser({
    username: 'kostyniuk',
    fullname: 'Alex Kostyniuk',
    age: 20,
    bornAt: 2000,
  }) //It won't work if you add any not specified in the Person interface props
);
