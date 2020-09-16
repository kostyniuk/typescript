interface Person {
  username: string;
  fullname: string;
  age: number;
}

const loguser = (person: Person): string => {
  const { username, fullname, age } = person;
  return `@${username} is ${fullname} and he/she is ${age} years old`;
};

console.log(
  loguser({ username: 'kostyniuk', fullname: 'Alex Kostyniuk', age: 20 }) //It won't work if you add any not specified in the Person interface props
);
