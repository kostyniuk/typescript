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
    let blocksIndexes = [];
    let busy = true;
    let index: number;
    for (let i = 0; i < blocks; i++) {
      while (busy) {
        index = getRandomIntRange(0, this.blocksQuantity);
        // if the block is already in use
        if (!this.memory[index].bits.filter(bit => bit !== 0).length) {
          console.log({ index }, this.memory[index])
          this.memory[index] = this.generateData();
          busy = false;
        }
      }
      this.bitMap[index!] = 1;
      blocksIndexes.push(index!);
      busy = true;
    }
    const file: IOrdinarFileDescriptor = { type: 'ordinary', name, size, linksNumber: 0, blockMap: { links: blocksIndexes } }
    console.log({ file })
    this.files.push({ descriptor: file })
  }

  openFile(name: string): number | void {
    if (this.files.length) {
      const selectedFile = this.files.filter(file => file.descriptor.name === name);
      if (selectedFile.length) {
        const fd = getRandomIntRange(0, 1000)
        selectedFile[0].descriptor.fd = fd
        this.files.map(file => {
          if (file.descriptor.name === name) return selectedFile;
          return file
        })
        return fd
      }
    }
  }

  closeFile(fd: number) {
    this.files.map(file => {
      if (file.descriptor.fd === fd) {
        delete file.descriptor.fd;
      }
      return file
    })
  }

  readFile(fd: number, offset: number): void {
    const file = this.files.filter(file => file.descriptor.fd === fd)[0] as { descriptor: IOrdinarFileDescriptor };
    const { blockMap } = file.descriptor;
    console.log({ links: blockMap.links })
    const block = blockMap.links[offset];
    if (block) {
      console.log(this.memory[block].bits.join(' '))
      return;
    }
    console.log('Too large offset');
  }

  writeFile(fd: number, offset: number, size: number) {
    const file = this.files.filter(file => file.descriptor.fd === fd)[0] as { descriptor: IOrdinarFileDescriptor };
    const { blockMap } = file.descriptor;
    const block = blockMap.links[offset];
    let newDataInBlock = (new Array(this.blockSize)).fill(0)
    if (block) {
      for (let i = 0; i < size; i++) newDataInBlock[i] = getRandomIntRange(1, 9)
      console.log(this.memory[block].bits.join(' '))
      this.memory[block].bits = newDataInBlock
      console.log(this.memory[block].bits.join(' '))
      if (size > this.blockSize) {
        console.log('ERROR: Too much data')
      }
    } else {
      console.log('ERROR: This file consists of fewer quantity of blocks')
    }
    return;
  }

  link(name1: string, name2: string) {

    let newFile: IOrdinarFileDescriptor
    let index: number;
    let busy = true;
    this.files = this.files.map(file => {
      if (file.descriptor.name === name2) {
        let targetFile = file as { descriptor: IOrdinarFileDescriptor };
        while (busy) {
          index = getRandomIntRange(0, this.blocksQuantity);
          // if the block is already in use
          if (!this.memory[index].bits.filter(bit => bit !== 0).length) {
            this.memory[index] = this.generateData();
            this.bitMap[index] = 1;
            busy = false;
          }
        }

        let updatedBlockMap = JSON.parse(JSON.stringify(targetFile.descriptor.blockMap));
        updatedBlockMap.links.unshift(index); // links' blocks first, the last 4 is always from the original file
        targetFile.descriptor.linksNumber++;
        newFile = { type: 'ordinary', name: name1, size: 1, linksNumber: 0, blockMap: updatedBlockMap } // size - 1 block is the smallest i can achieve
        return targetFile;
      }
      return file
    })
    if (newFile!) {
      this.files.push({ descriptor: newFile! })
      console.log('Linked')
    } else {
      console.log('Not Linked')
    }
  }

  unlink(name: string) {
    const file = this.files.filter(file => file.descriptor.name === name)[0] as { descriptor: IOrdinarFileDescriptor };

    if (file) {
      const ownBlockIndex = file.descriptor.blockMap.links.shift();
      console.log({ ownBlockIndex })
      this.eraseBlock(ownBlockIndex!)
      this.files = this.files.filter(file => file.descriptor.name !== name)
    }

  }

  truncate(name: string, newSize: string) {
    throw new Error("Method not implemented.");
  }

  private eraseBlock(index: number) {
    this.memory[index] = { bits: (new Array(this.blockSize)).fill(0) };
    this.bitMap[index] = 0;
  }

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

      case 'read': {
        const [fd, offset] = params;
        fs!.readFile(Number(fd), Number(offset))
        break;
      }

      case 'write': {
        const [fd, offset, size] = params;
        fs!.writeFile(Number(fd), Number(offset), Number(size));
        break;
      }

      case 'link': {
        const [name1, name2] = params;
        fs!.link(name1, name2);
        break;
      }

      case 'unlink': {
        const [name] = params;
        fs!.unlink(name);
        break;
      }

      case 'truncate': {
        const [name, newSize] = params;
        fs!.truncate(name, newSize);
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
