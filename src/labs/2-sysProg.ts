let readline = require('readline');
const util = require('util');
readline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question[util.promisify.custom] = (question: string) => {
  return new Promise((resolve) => {
    readline.question(question, resolve);
  });
};

type FileType = 'ordinar' | 'directory'

interface IBlock {
  bits: number[]
}

interface IBlockMap {
  link1: number,
  link2: number,
  link3: number,
  links: number[]
}

interface IFileLink {
  name: string
  descriptor: IFileDescriptor
}

interface IFileDescriptor {
  type: FileType
  linksNumber: number
  size: number
}

interface IOrdinarFileDescriptor extends IFileDescriptor {
  blockMap: IBlockMap
}

interface IDirectoryFileDescriptor extends IFileDescriptor {
  data: IFileLink[]
}

interface IFile {
  descriptor: IFileDescriptor
}

interface IFileSystem {
  size: number
  blocksQuantity: number
  blockSize: number
  maxDescriptorsNum: number
  memory: IBlock[]
  bitMap: Number[]
}

class FileSystem implements IFileSystem {
  size: number
  blocksQuantity: number
  blockSize: number
  maxDescriptorsNum: number
  memory: IBlock[] = []
  bitMap: Number[]


  constructor(size: number, blockSize: number, maxDescriptorsNum: number) {
    this.size = size;
    this.blockSize = blockSize;
    this.blocksQuantity = size / blockSize
    this.maxDescriptorsNum = maxDescriptorsNum;
    this.formMemory()
    this.bitMap = new Array(size / blockSize).fill(0)
  }

  private formMemory(): void {
    for (let i = 0; i < this.blocksQuantity; i++) {
      this.memory.push({ bits: new Array(this.blockSize).fill(0) })
    }
  }

}

(async () => {

  const fs = new FileSystem(64, 4, 15)

  console.log({ fs, memory: fs.memory[0] })

  let exit = false

  while (!exit) {
    const answer: string = await util.promisify(readline.question)('> ');

    switch (answer) {

      case 'mount': {
        console.log('File system connected');
        break;
      }

      case 'exit':
        exit = true
        console.log('Exited the fs');
        break;

      default:
        console.log('Unknown command')
    }

  }

  readline.close();
})()
