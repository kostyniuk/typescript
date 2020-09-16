export {};

interface Person {
  username?: string;
  fullname: string;
  age: number;
}

const loguser = (person: Person): string => {
  const { username, fullname, age } = person;

  if (!username) {
    return `No username provided`;
  }

  return `@${username} is ${fullname} and he/she is ${age} years old`;
};

//Username could be either specified or ommited
console.log(
  loguser({ username: 'kostyniuk', fullname: 'Alex Kostyniuk', age: 20 }) //@kostyniuk is Alex Kostyniuk and he/she is 20 years old
);
console.log(
  loguser({ fullname: 'Alex Kostyniuk', age: 20 }) //No username provided
);
