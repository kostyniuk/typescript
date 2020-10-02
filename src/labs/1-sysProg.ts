
type trigger = 0 | 1;

type accessTypes = 'READ' | 'MODIFY'

const getRandomIntRange = (min: number, max: number): number => {
  return Math.round(Math.random() * (max - min) + min);
}

const generateAccessType = (): accessTypes => Math.random() > 0.5 ? 'MODIFY' : 'READ'

interface VirtualPage {
  p: trigger,
  r: trigger,
  m: trigger,
  ppn: number | 'x'
}

interface PhysicalPage {
  index: number;
  indexOfVP: number;
}

interface IProcess {
  id: number,
  virtualPages: VirtualPage[],
  workingSet: number, // first n pages from VPs
  accessToReset: number,
  accessCount: number,
  memory: PhysicalMemory
}

interface IVirtualAdress {
  number: VirtualPage,
  offset: number
}

interface IPhysicalMemory {
  numOfPageBlocks: number;
  sizeOfPageBlock: number;
  free: PhysicalPage[];
  busy: PhysicalPage[];
}

class Process implements IProcess {
  id!: number;
  virtualPages: VirtualPage[] = [];
  workingSet = 0;
  accessToReset = 10;
  accessCount = 0;
  memory: PhysicalMemory;

  constructor(appealsToReset: number, memory: PhysicalMemory) {
    this.accessToReset = appealsToReset;
    this.memory = memory
    this.generateId()
    this.generateVirtualPages()
    this.generateInitialWS()
  }

  get numOfVirtualPages(): number {
    return this.virtualPages.length;
  }

  private generateId(): void {
    this.id = getRandomIntRange(1024, 49151)
  };

  private generateVirtualPages(): void {
    const quantity = getRandomIntRange(this.memory.numOfPageBlocks, this.memory.numOfPageBlocks * 2)
    for (let i = 0; i < quantity; i++) this.virtualPages.push({ p: 0, r: 0, m: 0, ppn: 'x' })
  }

  private generateInitialWS(): void {
    this.workingSet = Math.ceil(this.numOfVirtualPages / 3)
  }

  public getMemory(): void {

    const accessType = generateAccessType();

    if (Math.random() < 0.9) {
      // working set
      const index = getRandomIntRange(0, this.workingSet - 1);
      const selectedVirtualPage = this.virtualPages[index]
      console.log({ selectedVirtualPage, index, accessType })

      selectedVirtualPage.m = accessType === 'MODIFY' ? 1 : 0

      if (selectedVirtualPage.p) {
        console.log('ALREADY USING A PAGE BLOCK')
        this.accessCount++;
        return;
      } else {
        if (memory.freePagesQuantity) {
          memory.usePageBlock(index)
          selectedVirtualPage.p = 1
          selectedVirtualPage.r = 1
          console.log({ a: memory.busy, b: memory.free })
          this.virtualPages[index] = selectedVirtualPage;
          this.accessCount++;
        } else {
          // page fault
        }
      }


    } else {
      // average pages
      console.log('Not from the working set')
    }

    console.log({ vp: this.virtualPages })

  }

}

class PhysicalMemory implements IPhysicalMemory {

  numOfPageBlocks = 0;
  sizeOfPageBlock = 0;
  busy: PhysicalPage[] = []
  free: PhysicalPage[] = [];


  constructor(numOfPageBlocks: number, sizeOfPageBlock: number) {
    this.numOfPageBlocks = numOfPageBlocks;
    this.sizeOfPageBlock = sizeOfPageBlock;
    this.setInitialState();
  }

  private setInitialState(): void {
    for (let i = 0; i < this.numOfPageBlocks; i++) this.free.push({ index: i, indexOfVP: -1 })
  }

  get freePagesQuantity(): number {
    return this.free.length;
  }

  usePageBlock(indexOfVP: number): void {
    if (this.free.length) {
      const pageBlock: PhysicalPage = this.free.shift() as PhysicalPage
      this.busy.push({ ...pageBlock, indexOfVP })
    } else {
      // algorithm
    }

  }

}

const numPhysicalPages = 8;
const sizePageBlock = 4096;

const memory = new PhysicalMemory(numPhysicalPages, sizePageBlock)
const process1 = new Process(5, memory);

process1.getMemory()
process1.getMemory()
process1.getMemory()
process1.getMemory()
process1.getMemory()
// process1.getMemory()
// process1.getMemory()

// console.log({ process1, vp: process1.virtualPages, vpQuantity: process1.numOfVirtualPages, memory, free: memory.free })

