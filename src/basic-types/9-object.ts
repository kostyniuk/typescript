declare function create(o: object | null): void;

// OK
create({ prop: 0 });
create(null);