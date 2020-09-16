export {};

// interface ClockConstructor {
//   new (hour: number, minute: number): ClockInterface;
// }

// interface ClockInterface {
//   tick(): void;
// }

// function createClock(
//   ctor: ClockConstructor,
//   hour: number,
//   minute: number
// ): ClockInterface {
//   return new ctor(hour, minute);
// }

// class DigitalClock implements ClockInterface {
//   constructor(h: number, m: number) {
//     console.log({ h, m });
//   }
//   tick() {
//     console.log('beep beep');
//   }
// }

// class AnalogClock implements ClockInterface {
//   constructor(h: number, m: number) {
//     console.log({ h, m });
//   }
//   tick() {
//     console.log('tick tock');
//   }
// }

// let digital = createClock(DigitalClock, 12, 17);
// let analog = createClock(AnalogClock, 7, 32);

// console.log({ analog, digital });
interface ClockConstructor {
  new (hour: number, minute: number): ClockInterface;
}

interface ClockInterface {
  tick(): void;
}

const Clock: ClockConstructor = class Clock implements ClockInterface {
  constructor(h: number, m: number) {
    console.log({ h, m });
  }
  tick() {
    console.log('beep beep');
  }
};

const clock1 = new Clock(2, 3);

console.log({ clock1 });
