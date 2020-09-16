interface printInfoInterface {
  firstName: string;
  lastName: string;
  middleName?: string;
}

const printInfo = (info: printInfoInterface) => {
  if (info.middleName)
    return `${info.firstName} ${info.middleName} ${info.lastName}`;
  return `${info.firstName} ${info.lastName}`;
};

const me = { firstName: 'Alex', lastName: 'Kostyniuk' };
const someone = { firstName: 'John', middleName: 'Steven', lastName: 'Lewis' };

[me, someone].forEach((i) => console.log(printInfo(i)));
