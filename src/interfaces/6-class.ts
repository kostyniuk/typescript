interface ClockInterface {
  currentTime: Date;
  setTime(d: Date): void;
}

class Clock implements ClockInterface {
  currentTime: Date = new Date();
  setTime(d: Date) {
    this.currentTime = d;
  }
  constructor(h: number, m: number) {
    console.log({ h, m });
  }
}

const clock1 = new Clock(1, 2);
clock1.setTime(new Date(1));
console.log({ clock1 });

