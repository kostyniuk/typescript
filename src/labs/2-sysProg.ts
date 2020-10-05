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

const getRandomIntRange = (min: number, max: number): number => {
  return Math.round(Math.random() * (max - min) + min);
}

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
  files: IFile[]
}

class FileSystem implements IFileSystem {
  size: number
  blocksQuantity: number
  blockSize: number
  maxDescriptorsNum: number
  memory: IBlock[] = []
  bitMap: Number[]
  files: IFile[] = []

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

  createFile(name: string): void {
    const size = getRandomIntRange(1, 4 * this.blockSize) // selected 4 just for testing purposes
    const blocks = Math.ceil(size / this.blockSize);
    for (let i = 0; i < blocks; i++) {
      const index = getRandomIntRange(0, this.blocksQuantity)
      this.memory[index] = this.generateData()
      this.bitMap[index] = 1;
      console.log({ size, blocks, index, bits: this.generateData() })
    }
    console.log(name)
  }

  private generateData(): IBlock {
    let block: IBlock = { bits: (new Array(this.blockSize)).fill(0) };
    block.bits = block.bits.map(_ => getRandomIntRange(0, 9))
    return block;
  }
}

const handleMultiCommands = (str: string): [string[], string] => {
  console.log({ str })

  const [command, ...params] = str.split(' ')

  return [params, command]
}

(async () => {

  let mounted = false

  let fs: FileSystem | null;

  let exit = false

  while (!exit) {
    let params: string[] = [];
    let answer: string = await util.promisify(readline.question)('> ');

    if (answer.split(' ').length > 1) {
      [params, answer] = handleMultiCommands(answer)
    }

    console.log({ answer, params })

    switch (answer) {

      case 'mount': {
        if (mounted) {
          console.log('File system is already mounted');
        } else {
          fs = new FileSystem(64, 4, 15);
          mounted = true;
          console.log('File system mounted');
          console.log({ fs, memory: fs.memory[0] })
        }
        break;
      }

      case 'unmount': {
        if (mounted) {
          fs = null;
          mounted = false;
          console.log('File system unmounted');
          console.log({ fs })
        } else {
          console.log('File system isn\'t mounted');
        }
        break;
      }

      case 'create': {
        const name = params[0]
        if (!name) {
          console.log('ERROR: No name provided')
          break;
        }

        if (fs!) {
          fs!.createFile(name)
          console.log('CREATING FILE', name)

        } else {
          console.log('ERROR: File system isn\'t mounted')
        }
        break;
      }

      case 'exit':
        exit = true
        console.log('Exited the fs');
        break;

      default:
        console.log(fs!)
        fs!.memory.map(el => console.log(el))
        console.log('Unknown command')
    }

  }

  readline.close();
})()
