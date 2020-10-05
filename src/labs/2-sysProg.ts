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

type FileType = 'ordinary' | 'directory'

type IFileDescriptor = IOrdinarFileDescriptor | IDirectoryFileDescriptor;

interface IBlock {
  bits: number[]
}

interface IBlockMap {
  links: number[]
}

interface IFileLink {
  name: string
  descriptor: IFileDescriptor
}

interface IFileDescriptorBasic {
  name: string
  type: FileType
  linksNumber: number
  size: number
  fd?: number
}

interface IOrdinarFileDescriptor extends IFileDescriptorBasic {
  blockMap: IBlockMap
}

interface IDirectoryFileDescriptor extends IFileDescriptorBasic {
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
    let blocksIndexes = []
    for (let i = 0; i < blocks; i++) {
      const index = getRandomIntRange(0, this.blocksQuantity)
      this.memory[index] = this.generateData()
      this.bitMap[index] = 1;
      blocksIndexes.push(index);
    }
    const file: IOrdinarFileDescriptor = { type: 'ordinary', name, size, linksNumber: 0, blockMap: { links: blocksIndexes } }
    console.log({ file })
    this.files.push({ descriptor: file })
  }

  openFile(name: string): number {
    const selectedFile = this.files.filter(file => file.descriptor.name === name);
    const fd = getRandomIntRange(0, 1000)
    selectedFile[0].descriptor.fd = fd
    this.files.map(file => {
      if (file.descriptor.name === name) return selectedFile;
      return file
    })
    return fd
  }

  closeFile(fd: number) {
    this.files.map(file => {
      if (file.descriptor.fd === fd) {
        delete file.descriptor.fd;
      }
      return file
    })
  }

  // private addToDescriptor(): void {

  // }

  private generateData(): IBlock {
    let block: IBlock = { bits: (new Array(this.blockSize)).fill(0) };
    block.bits = block.bits.map(_ => getRandomIntRange(0, 9))
    return block;
  }
}

const handleMultiCommands = (str: string): [string[], string] => {
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

      case 'ls': {
        if (mounted) fs!.files.map((file, i) => console.log(`File ${file.descriptor.name} with its descriptor ${i}`));
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

      case 'open': {
        const name = params[0]
        if (!name) {
          console.log('ERROR: No name provided')
          break;
        }

        if (fs!) {
          const fd = fs!.openFile(name)
          console.log(fd)
        } else {
          console.log('ERROR: File system isn\'t mounted')
        }
        break;
      }

      case 'close': {
        const fd = Number(params[0]);
        if (!fd) {
          console.log('ERROR: No fd provided')
          break;
        }

        if (fs!) {
          fs!.closeFile(fd);
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
        fs!.files.map(el => console.log(el.descriptor))
        console.log('Unknown command')
    }

  }

  readline.close();
})()
