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

const readNelements = (arr: number[], n: number): number[] => {
  return arr.slice(0, n);
}

type FileType = 'ordinary' | 'directory' | 'symlink'

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
  names: string[]
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

    if (this.bitMap.filter(bit => !bit).length < Math.ceil(size / this.blockSize)) {
      console.log('ERROR: Unable to create the file as of luck of memory')
      return;
    }

    if (this.files.length === this.maxDescriptorsNum) {
      console.log('ERROR: Unable to create the file as of max descriptors restriction')
      return;
    }

    const blocks = Math.ceil(size / this.blockSize);
    let blocksIndexes = [];
    let busy = true;
    let index: number;
    for (let i = 0; i < blocks; i++) {
      while (busy) {
        index = getRandomIntRange(0, this.blocksQuantity - 1);
        // if the block is already in use
        // console.log({ index })
        if (!this.bitMap[index]) {
          // console.log({ index }, this.memory[index])
          this.memory[index] = this.generateData();
          busy = false;
        }
      }
      this.bitMap[index!] = 1;
      blocksIndexes.push(index!);
      busy = true;
    }
    const file: IOrdinarFileDescriptor = { type: 'ordinary', names: [name], size, linksNumber: 1, blockMap: { links: blocksIndexes } }
    console.log({ file })
    this.files.push({ descriptor: file })
  }

  openFile(name: string): number | void {
    if (this.files.length) {
      const selectedFile = this.files.filter(file => file.descriptor.names.includes(name))
      console.log({ selectedFile })
      if (selectedFile.length) {
        const fd = getRandomIntRange(0, 1000)
        selectedFile[0].descriptor.fd = fd
        this.files.map(file => {
          if (file.descriptor.names.includes(name)) return selectedFile;
          return file
        })
        this.files.map(el => console.log(el))
        return fd
      }
    }
  }

  closeFile(fd: number) {
    this.files.map(file => {
      if (file.descriptor['fd'] === fd) {
        delete file.descriptor.fd;
      }
      return file
    })
  }

  readFile(fd: number, offset: number, size: number): void {
    const file = this.files.filter(file => file.descriptor.fd === fd)[0] as { descriptor: IOrdinarFileDescriptor };

    if (!file) {
      console.log('Wrong fd provided')
      return;
    }

    const { blockMap } = file.descriptor;
    // console.log({ links: blockMap.links })
    const block = blockMap.links[offset];
    if (block) {
      const data = this.memory[block].bits
      console.log(readNelements(data, size).join(' '))
      return;
    }
    console.log('Too large offset');
  }

  writeFile(fd: number, offset: number, size: number) {

    if (size > this.blockSize) {
      console.log('ERROR: Too much data');
      return;
    }

    const file = this.files.filter(file => file.descriptor.fd === fd)[0] as { descriptor: IOrdinarFileDescriptor };

    if (!file) {
      console.log('Wrong fd provided')
      return;
    }

    const { blockMap } = file.descriptor;
    const block = blockMap.links[offset];
    let newDataInBlock = (new Array(this.blockSize)).fill(0)
    if (block) {
      for (let i = 0; i < size; i++) newDataInBlock[i] = getRandomIntRange(1, 9)
      console.log('Old: ', this.memory[block].bits.join(' '))
      this.memory[block].bits = newDataInBlock
      console.log('New: ', this.memory[block].bits.join(' '))

    } else {
      console.log('ERROR: This file consists of fewer quantity of blocks')
    }
    return;
  }

  link(name1: string, name2: string) {

    this.files = this.files.map(file => {
      if (file.descriptor.names.includes(name2)) {
        file.descriptor.names.push(name1)
        file.descriptor.linksNumber++;
      }
      return file
    })
    this.files.map(el => console.log(el))

  }

  unlink(name: string) {
    const file = this.files.filter(file => file.descriptor.names.includes(name))[0] as { descriptor: IOrdinarFileDescriptor };

    this.files.map(el => console.log(el))

    if (file.descriptor.linksNumber > 1) {
      file.descriptor.names = file.descriptor.names.filter(cur => cur !== name)
      file.descriptor.linksNumber--;
      this.files.map(el => console.log(el));
      return;
    } else {
      console.log(file.descriptor.blockMap.links);
      this.files = this.files.filter(fileDesc => !fileDesc.descriptor.names.includes(name));
      console.log(this.memory)
      file.descriptor.blockMap.links.map(block => this.eraseBlock(block))
      console.log('-------')
      console.log(this.memory)
      this.files.map(el => console.log(el))
    }

  }

  truncate(name: string, newSize: number) {
    let initialSize = this.files.filter(file => file.descriptor.names.includes(name))[0].descriptor.size
    let intialBlocks = initialSize % this.blockSize ? Math.ceil(initialSize / this.blockSize) : initialSize / this.blockSize;

    if (newSize === initialSize) return;

    if (newSize > initialSize) {
      this.expandFile(name, intialBlocks, newSize);
      return;
    }

    this.reduceFile(name, newSize)
  }

  private expandFile(name: string, intialBlocks: number, newSize: number): void {
    const requiredBlocks = this.calcBlocks(newSize) - intialBlocks;

    if (this.bitMap.filter(bit => !bit).length < requiredBlocks) {
      console.log('ERROR: Unable to expand the file as of luck of memory')
      return;
    }

    const freeBlocks = this.selectFreeBlocks(requiredBlocks)

    this.files = this.files.map(file => {
      const current = file as { descriptor: IOrdinarFileDescriptor };

      if (!freeBlocks.length) {
        const lastBlock = current.descriptor.blockMap.links[intialBlocks - 1]
        if (newSize % this.blockSize) {
          const howManyFree = this.blockSize - newSize % this.blockSize;
          for (let i = howManyFree, j = this.blockSize - 1; i > 0; i--, j--) {
            this.memory[lastBlock].bits[j] = 0
          }
          current.descriptor.size = newSize;
        }
      } else {
        if (current.descriptor.names.includes(name)) {
          current.descriptor.blockMap.links.push(...freeBlocks)
          current.descriptor.size = newSize;
        }
      }
      return current
    })

    freeBlocks.map(index => {
      this.memory[index].bits = (new Array(this.blockSize)).fill(0) // uninitialized data equals 0
      this.bitMap[index] = 1;
    })
  }

  private reduceFile(name: string, newSize: number): void {
    const requiredBlocks = this.calcBlocks(newSize)

    this.files = this.files.map(file => {
      const current = file as { descriptor: IOrdinarFileDescriptor };
      if (current.descriptor.names.includes(name)) {

        while (requiredBlocks !== current.descriptor.blockMap.links.length) {
          const index = current.descriptor.blockMap.links.pop()
          this.eraseBlock(index!)
        }

        const lastBlock = current.descriptor.blockMap.links[requiredBlocks - 1]

        if (newSize % this.blockSize) {
          const howManyFree = this.blockSize - newSize % this.blockSize;
          for (let i = howManyFree, j = this.blockSize - 1; i > 0; i--, j--) {
            this.memory[lastBlock].bits[j] = 0
          }
        }

        current.descriptor.size = newSize;

      }
      return current;
    })

  }

  private calcBlocks(size: number): number {
    return Math.ceil(size / this.blockSize)
  }

  private eraseBlock(index: number) {
    this.memory[index] = { bits: (new Array(this.blockSize)).fill(0) };
    this.bitMap[index] = 0;
  }

  private selectFreeBlocks(n: number): number[] {

    let indexes: number[] = [];

    while (indexes.length !== n) {
      const index = getRandomIntRange(0, this.blocksQuantity - 1);
      if (!this.bitMap[index]) {
        indexes.push(index)
        this.bitMap[index] = 1;
      }
    }

    return indexes
  }

  // private attachBlock(index: number) {
  //   this.memory[index] = this.generateData();
  //   this.bitMap[index] = 1
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

  let mounted = false;

  let fs: FileSystem | null;

  let exit = false;

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
          console.log({ fs, typicalBlock: fs.memory[0] })
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

      case 'filestat': {
        if (!mounted) break;
        const [id] = params;
        const file = fs!.files[Number(id)]
        if (file) console.log(file.descriptor);
        break;
      }

      case 'ls': {
        if (mounted) fs!.files.map((file, i) => console.log(`FileNames ${file.descriptor.names} with their descriptor ${i}`));
        break;
      }

      case 'create': {
        if (!mounted) break;
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
        if (!mounted) break;
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
        if (!mounted) break;
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

      case 'read': {
        if (!mounted) break;
        const [fd, offset, size] = params;
        fs!.readFile(Number(fd), Number(offset), Number(size))
        break;
      }

      case 'write': {
        if (!mounted) break;
        const [fd, offset, size] = params;
        fs!.writeFile(Number(fd), Number(offset), Number(size));
        break;
      }

      case 'link': {
        if (!mounted) break;
        const [name1, name2] = params;
        fs!.link(name1, name2);
        break;
      }

      case 'unlink': {
        if (!mounted) break;
        const [name] = params;
        fs!.unlink(name);
        break;
      }

      case 'truncate': {
        if (!mounted) break;
        const [name, newSize] = params;
        fs!.truncate(name, Number(newSize));
        break;
      }

      case 'show': {
        if (!mounted) break;

        console.log(fs!)

        console.log('---MEMORY---')
        fs!.memory.map(el => console.log(el))

        console.log('---FILES---')
        fs!.files.map(el => console.log(el.descriptor))
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
