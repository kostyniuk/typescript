
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
  pid: number;
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

  private getMemory(offset: number): void {

    const accessType = generateAccessType();

    if (Math.random() < 0.9) {
      // working set
      const index = getRandomIntRange(0, this.workingSet - 1);
      const selectedVirtualPage = this.virtualPages[index]
      console.log({ selectedVirtualPage, index, accessType })
      if (selectedVirtualPage.p) {
        this.setAttributes(selectedVirtualPage, accessType)
        this.virtualPages[index] = selectedVirtualPage;
        this.accessCount++;
        this.logAppeal(index, offset, this.virtualPages[index].ppn)
        return;
      } else {
        this.locateMemory(selectedVirtualPage, index, this.virtualPages, this.memory)
        this.setAttributes(selectedVirtualPage, accessType)
        this.accessCount++;
        this.logAppeal(index, offset, this.virtualPages[index].ppn)
        return;
      }
    } else {
      // average pages
      const index = getRandomIntRange(this.workingSet, this.numOfVirtualPages - 1);
      const selectedVirtualPage = this.virtualPages[index]

      if (!selectedVirtualPage.p) {
        this.locateMemory(selectedVirtualPage, index, this.virtualPages, this.memory);
        this.setAttributes(selectedVirtualPage, accessType)
        this.virtualPages[index] = selectedVirtualPage;
      } else {
        this.setAttributes(selectedVirtualPage, accessType);
      }
      this.accessCount++;
      this.logAppeal(index, offset, this.virtualPages[index].ppn)
      return;
    }
  }

  private setAttributes(vp: VirtualPage, accessType: accessTypes): void {
    vp.p = 1;
    if (!vp.m) vp.m = accessType === 'MODIFY' ? 1 : 0
    if (!vp.r) vp.r = accessType === 'READ' ? 1 : 0
  }

  private locateMemory(currentVP: VirtualPage, currentIndex: number, vps: VirtualPage[], phMemory: PhysicalMemory): void {
    if (phMemory.freePagesQuantity) {
      const pb = memory.usePageBlock(this.id, currentIndex)
      currentVP.p = 1;
      currentVP.ppn = pb
      vps[currentIndex] = currentVP;
      this.accessCount++;
    } else {
      const nru = new NRU(currentVP, currentIndex)
      nru.divideVPs(this.virtualPages)
      nru.execute(this.virtualPages, this.memory);
    }
  }

  private resetR(): void {
    console.log('RESETING R')
    this.virtualPages = this.virtualPages.map(page => {
      page.r = 0;
      return page
    })
  }

  public doSomethingWithMemory(): void {
    this.getMemory(getRandomIntRange(0, this.memory.sizeOfPageBlock));
    if (this.accessCount % this.accessToReset === 0) this.resetR()
    // this.logState()
  }

  logAppeal(vpIndex: number, offset: number, IndexOfPB: number | 'x'): void {
    console.log({ virtualPage: vpIndex, offset, pageBlock: IndexOfPB })
  }

  public logState(): void {
    console.log({ vp: this.virtualPages, pid: this.id })
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
    for (let i = 0; i < this.numOfPageBlocks; i++) this.free.push({ index: i, pid: -1, indexOfVP: -1 })
  }

  get freePagesQuantity(): number {
    return this.free.length;
  }

  usePageBlock(pid: number, indexOfVP: number): number {
    if (this.free.length) { // redundant, already peformed, just to know for sure
      const pageBlock: PhysicalPage = this.free.shift() as PhysicalPage
      this.busy.push({ ...pageBlock, pid, indexOfVP })
      return pageBlock.index
    }
    return -1
  }
}

interface INRU {
  vp: VirtualPage;
  vpIndex: number,
  Class0: number[],
  Class1: number[],
  Class2: number[],
  Class3: number[]
}

class NRU implements INRU {
  vp: VirtualPage;
  vpIndex;
  Class0: number[] = [];
  Class1: number[] = [];
  Class2: number[] = [];
  Class3: number[] = [];

  constructor(vp: VirtualPage, index: number) {
    this.vp = vp;
    this.vpIndex = index
  }

  divideVPs(vps: VirtualPage[]): void {
    vps.map((vp, index) => {
      if (vp.ppn === 'x') return vp;
      const { r, m } = vp
      if (r) {
        if (m) {
          this.Class3.push(index)
        } else {
          this.Class2.push(index)
        }
      } else {
        if (m) {
          this.Class1.push(index)
        } else {
          this.Class0.push(index)
        }
      }
      return vp;
    })
    console.log({ class0: this.Class0, class1: this.Class1, class2: this.Class2, class3: this.Class3 })
  }

  execute(vps: VirtualPage[], memory: PhysicalMemory): void {

    let targetClass = this.Class3

    if (this.Class0.length) {
      targetClass = this.Class0
    } else if (this.Class1.length) {
      targetClass = this.Class1
    } else if (this.Class2.length) {
      targetClass = this.Class2
    }

    console.log('BEFORE REPLACEMENT');
    console.log(vps, memory.busy)

    const victim = targetClass.shift() as number;
    const victimPage = vps[victim];

    const { ppn } = victimPage

    victimPage.p = 0;
    victimPage.m = 0;
    victimPage.r = 0;
    victimPage.ppn = 'x'

    vps[victim] = victimPage;

    console.log(`REPLACING VP №${victim} WITH №${this.vpIndex}`)

    this.vp.p = 1;
    this.vp.ppn = ppn;

    vps[this.vpIndex] = this.vp;

    memory.busy = memory.busy.map(block => {
      if (block.index === ppn) block.indexOfVP = this.vpIndex;
      return block
    })

    console.log('AFTER REPLACEMENT');
    console.log(vps, memory.busy)
    return;
  }

}

const numPhysicalPages = 8;
const sizePageBlock = 4096;

const memory = new PhysicalMemory(numPhysicalPages, sizePageBlock)
const process1 = new Process(5, memory);
const process2 = new Process(5, memory);
const process3 = new Process(5, memory);

interface IProcessExecution {
  process: Process,
  ticks: number,
  [propName: string]: any;
  // finished: boolean
}

interface IprocessExecutionFn {
  (processes: IProcessExecution[]): void;
}

let processExecution: IprocessExecutionFn;

processExecution = (processes = []) => {
  let executed = false

  processes.map(process => process.finished = false)

  while (!executed) {
    processes = processes.map(process => {

      if (process.finished) return process;

      process.process.doSomethingWithMemory();
      process.ticks -= 1;

      if (!process.ticks) process.finished = true;

      return process;
    })

    if (!processes.map(process => process.finished).filter(num => !num).length) executed = true
  }
}

processExecution([{ process: process1, ticks: 5 }, { process: process2, ticks: 7 }, { process: process3, ticks: 6 }])
