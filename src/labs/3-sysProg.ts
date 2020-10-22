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

const deepCopy = (_: object): object => JSON.parse(JSON.stringify(_))

const getRandomIntRange = (min: number, max: number): number => {
  return Math.round(Math.random() * (max - min) + min);
}

const readNelements = (arr: number[], n: number): number[] => {
  return arr.slice(0, n);
}

type FileType = 'ordinary' | 'directory' | 'symlink'

type IFileDescriptor = IOrdinarFileDescriptor | IDirectoryFileDescriptor | ISymLinkDescriptor;

interface IBlock {
  bits: number[]
}

interface IBlockMap {
  links: number[]
}

interface IFileLink {
  name: string
  descriptor: number
}

interface IFileDescriptorBasic {
  id: number
  type: FileType
  size: number
  blockMap: IBlockMap
}

interface ISymLinkDescriptor extends IFileDescriptorBasic {
  name: string
  value: string
}

interface IOrdinarFileDescriptor extends IFileDescriptorBasic {
  names: string[]
  linksNumber: number
  fd?: number
}

interface IDirectoryFileDescriptor extends IFileDescriptorBasic {
  name: string
  data: IFileLink[]
  current: IFileLink
  parent: IFileLink
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
  workingDirectory: IFileLink;
}

class FileSystem implements IFileSystem {

  size: number
  blocksQuantity: number
  blockSize: number
  maxDescriptorsNum: number
  memory: IBlock[] = []
  bitMap: Number[]
  files: IFile[] = []
  workingDirectory: IFileLink = { name: '', descriptor: -1 };
  id = 0;

  constructor(size: number, blockSize: number, maxDescriptorsNum: number) {
    this.size = size;
    this.blockSize = blockSize;
    this.blocksQuantity = size / blockSize
    this.maxDescriptorsNum = maxDescriptorsNum;
    this.formMemory()
    this.bitMap = new Array(size / blockSize).fill(0)
    this.createRootDirectory()
    this.workingDirectory = { descriptor: 0, name: 'root' }
  }

  private createRootDirectory(): void {
    const dir: IDirectoryFileDescriptor = { id: this.id, name: 'root', size: 1, type: 'directory', blockMap: { links: [0] }, data: [], current: { descriptor: 0, name: 'root' }, parent: { descriptor: 0, name: 'root' } }
    this.memory[0] = this.generateData();
    this.bitMap[0] = 1; // the first block is ised for the root directory
    this.id++;
    this.files.push({ descriptor: dir })
  }

  private formMemory(): void {
    for (let i = 0; i < this.blocksQuantity; i++) {
      // root directory
      this.memory.push({ bits: new Array(this.blockSize).fill(0) })
    }
  }

  createFile(name: string): void {
    const size = getRandomIntRange(1, 4 * this.blockSize) // selected 4 just for testing purposes

    if (this.isNameAlreadyTaken(name)) {
      this.handleAlreadyTakenName();
      return;
    }

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
    const file: IOrdinarFileDescriptor = { id: this.id, type: 'ordinary', names: [name], size, linksNumber: 1, blockMap: { links: blocksIndexes } }
    this.id++;

    // Adding descriptor to the current directory
    this.files = this.files.map(_ => {
      if (_.descriptor.id === this.workingDirectory.descriptor) {
        if ('data' in _.descriptor) {
          _.descriptor.data.push({ descriptor: file.id, name: name })
        }
        return _
      }
      return _
    })

    this.files.push({ descriptor: file })
  }

  openFile(name: string): number | void {

    const oldWorkDir = deepCopy(this.workingDirectory) as IFileLink; // object in js/ts has the same position in memory, so to delete that connection we need need to use deepCopy 

    const fileName = this.getFile(name)

    if (!fileName) {
      console.log('Wrong path provided');
      return;
    }

    const names = this.getNamesInFolder(this.workingDirectory)

    if (this.files.length) {
      const selectedFile = this.files.filter(file => {
        if ('names' in file.descriptor && names.includes(fileName)) {
          return file.descriptor.names.includes(fileName)
        }
        return false
      })

      if (selectedFile.length) {
        const fd = getRandomIntRange(0, 1000)

        if ('names' in selectedFile[0].descriptor) {
          selectedFile[0].descriptor.fd = fd
          this.files.map(file => {
            if ('names' in file.descriptor) {
              if (file.descriptor.names.includes(name)) return selectedFile;
            }
            return file
          })
          this.workingDirectory = oldWorkDir;
          // this.files.map(el => console.log(el))
          return fd
        }
      }
    }
  }

  closeFile(fd: number) {
    this.files.map(file => {
      if ('names' in file.descriptor) {
        if (file.descriptor['fd'] === fd) {
          delete file.descriptor.fd;
        }
      }
      return file
    })
  }

  readFile(fd: number, offset: number, size: number): void {
    const file = this.files.filter(file => {
      if ('names' in file.descriptor) {
        return file.descriptor.fd === fd;
      }
      return false;
    })[0] as { descriptor: IOrdinarFileDescriptor }

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

    const file = this.files.filter(file => {
      if ('names' in file.descriptor) {
        return file.descriptor.fd === fd;
      }
      return false;
    })[0] as { descriptor: IOrdinarFileDescriptor }

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

    const oldWorkDir = deepCopy(this.workingDirectory) as IFileLink; // object in js/ts has the same position in memory, so to delete that connection we need need to use deepCopy 

    const fileName = this.getFile(name2)

    if (!fileName) {
      console.log('Wrong path provided');
      return;
    }

    if (this.isNameAlreadyTaken(name1)) {
      this.handleAlreadyTakenName();
      return;
    }

    let descOriginFile = NaN;
    let names: string[] = this.getNamesInFolder(this.workingDirectory);

    this.files = this.files.map(file => {
      if ('names' in file.descriptor && names.includes(fileName)) {
        if (file.descriptor.names.includes(fileName)) {
          descOriginFile = file.descriptor.id;
          file.descriptor.names.push(name1)
          file.descriptor.linksNumber++;
        }
      }
      return file
    })

    this.addToDirectory({ descriptor: descOriginFile, name: name1 })

    this.workingDirectory = oldWorkDir
  }

  private getNamesInFolder(current: IFileLink): string[] {
    let names: string[] = []
    this.files.map(file => {
      if ('data' in file.descriptor && file.descriptor.id === current.descriptor) {
        names = file.descriptor.data.map(tup => tup.name) // only files in this folder
      }
    });
    return names;
  }

  private addToDirectory(fileToAdd: IFileLink) {
    this.files.map(file => {
      if ('data' in file.descriptor && fileToAdd.descriptor) {
        if (file.descriptor.id === this.workingDirectory.descriptor) {
          file.descriptor.data.push(fileToAdd)
        }
      }
    })
  }

  unlink(name: string) {

    const oldWorkDir = deepCopy(this.workingDirectory) as IFileLink; // object in js/ts has the same position in memory, so to delete that connection we need need to use deepCopy 

    const fileName = this.getFile(name)

    if (!fileName) {
      console.log('Wrong path provided');
      return;
    }

    const names = this.getNamesInFolder(this.workingDirectory)

    const file = this.files.filter(file => {
      if ('names' in file.descriptor && names.includes(fileName)) {
        return file.descriptor.names.includes(fileName);
      }
      return false
    })[0] as { descriptor: IOrdinarFileDescriptor }

    // console.log({ file })

    this.files = this.files.map(_ => {
      if (_.descriptor.id === this.workingDirectory.descriptor && 'data' in _.descriptor) {
        // console.log(_.descriptor)
        _.descriptor.data = _.descriptor.data.filter(el => (el.name !== fileName))
      }
      return _
    })

    if (file.descriptor.linksNumber > 1) {
      file.descriptor.names = file.descriptor.names.filter(cur => cur !== fileName)
      file.descriptor.linksNumber--;

      this.workingDirectory = oldWorkDir;

      return;
    } else {
      // console.log(file.descriptor.blockMap.links);
      this.files = this.files.filter(_ => {
        if ('names' in _.descriptor) {
          return !_.descriptor.names.includes(fileName);
        }
        if (_.descriptor.id === this.workingDirectory.descriptor && 'data' in _.descriptor) {
          // console.log(_.descriptor)
          _.descriptor.data = _.descriptor.data.filter(el => (el.name !== fileName))
        }
        return _
      })

      // console.log(this.memory)
      file.descriptor.blockMap.links.map(block => this.eraseBlock(block))
      // console.log('-------')
      // console.log(this.memory)
      // this.files.map(el => console.log(el))

      this.workingDirectory = oldWorkDir;
    }
  }

  truncate(name: string, newSize: number) {

    const oldWorkDir = deepCopy(this.workingDirectory) as IFileLink; // object in js/ts has the same position in memory, so to delete that connection we need need to use deepCopy 

    const fileName = this.getFile(name)

    if (!fileName) {
      console.log('Wrong path provided');
      return;
    }

    const names = this.getNamesInFolder(this.workingDirectory)

    const file = this.files.filter(file => {
      if ('names' in file.descriptor && names.includes(fileName)) {
        return file.descriptor.names.includes(fileName);
      }
      return false
    })[0] as { descriptor: IOrdinarFileDescriptor }

    // console.log({ file })

    if (!file) {
      console.log('Wrong path provided');
      return;
    }

    let initialSize = this.files.filter(_ => {
      if ('names' in _.descriptor) {
        return _.descriptor.names.includes(fileName)
      }
      return false
    })[0].descriptor.size

    let intialBlocks = initialSize % this.blockSize ? Math.ceil(initialSize / this.blockSize) : initialSize / this.blockSize;

    this.workingDirectory = oldWorkDir;

    if (newSize === initialSize) return;

    if (newSize > initialSize) {
      this.expandFile(fileName, intialBlocks, newSize);
      return;
    }

    this.reduceFile(fileName, newSize)
  }

  mkdir(name: string) {

    const [blockNum] = this.selectFreeBlocks(1)

    const dir: IDirectoryFileDescriptor = { id: this.id, name: name, size: 1, type: 'directory', blockMap: { links: [blockNum] }, data: [], current: { descriptor: this.id, name }, parent: { descriptor: this.workingDirectory.descriptor, name: this.workingDirectory.name } }

    this.memory[blockNum] = this.generateData();

    this.bitMap[blockNum] = 1; // the first block is used for the root directory
    this.id++;

    this.files = this.files.map(_ => {
      if (_.descriptor.id === this.workingDirectory.descriptor) {
        if ('data' in _.descriptor) {
          _.descriptor.data.push({ descriptor: dir.id, name: name })
        }
        return _
      }
      return _
    })

    this.files.push({ descriptor: dir })
  }

  cd(path: string) {
    this.setWorkingDir(path)
    console.log(`Moved to ${this.workingDirectory.name}`)
  }

  rmdir(path: string) {

    const oldWorkDir = deepCopy(this.workingDirectory) as IFileLink; // object in js/ts has the same position in memory, so to delete that connection we need need to use deepCopy 

    console.log(this.workingDirectory)
    let parent: IFileLink;
    this.cd(path.split('/').join('/'))

    let empty = false

    this.files = this.files.filter(_ => {
      if ('data' in _.descriptor && _.descriptor.id === this.workingDirectory.descriptor) {
        parent = _.descriptor.parent;
        if (!_.descriptor.data.length) {
          empty = true;
          return false;
        }
        console.log('ERROR: This folder isn\'t empty')
      }
      return true;
    })

    if (empty) {
      this.files = this.files.map(_ => {
        if ('data' in _.descriptor && _.descriptor.id === parent.descriptor) {
          _.descriptor.data = _.descriptor.data.filter(el => (el.name !== this.workingDirectory.name))
        }
        return _
      })
    }

    this.workingDirectory = oldWorkDir
  }

  private setWorkingDir(path: string) {

    const divided = path.split('/');

    const prepared = this.subtituteSym(divided).join('/').split('/')

    if (!prepared[0].length && prepared.length <= 2) return;

    prepared.map((symb, i) => {

      // / handling
      if (i === 0 && symb === '') {
        this.files.map(file => {
          if (file.descriptor.id === 0 && 'data' in file.descriptor) {
            this.workingDirectory.descriptor = file.descriptor.parent.descriptor
            this.workingDirectory.name = file.descriptor.parent.name
          }
        })
      }

      if (symb === '..') {
        this.files.map(file => {
          if (file.descriptor.id === this.workingDirectory.descriptor && 'data' in file.descriptor) {
            this.workingDirectory.descriptor = file.descriptor.parent.descriptor
            this.workingDirectory.name = file.descriptor.parent.name
          }
        })
      } else if (symb === '.') {
        // no need for any change
      } else {
        let found = false
        this.files.map(file => {
          if (file.descriptor.id === this.workingDirectory.descriptor && 'data' in file.descriptor) {
            file.descriptor.data.map(tuple => {
              if (tuple.name === symb) {
                const desc = this.files.filter(cur => (cur.descriptor.id === tuple.descriptor && 'data' in cur.descriptor))[0] as { descriptor: IDirectoryFileDescriptor }
                if (desc) {
                  found = true;
                  this.workingDirectory.descriptor = desc.descriptor.id;
                  this.workingDirectory.name = desc.descriptor.name;
                } else {
                  console.log('ERROR: cd doesn\'t work with files, only with directories')
                }
              }
            })
          }
          // console.log({ found, symb })
        })
        if (!found) console.log(`ERROR: No such directory: ${symb}`)
      }
    })
  }

  private subtituteSym(path: string[]): string[] {
    let ready: string[] = []

    path.map(el => {
      let added = false
      if (el === '.' || el === '..') {
        ready.push(el)
        added = true
        return;
      } else {
        this.files.map(file => {
          if (('data' in file.descriptor && file.descriptor.name === el) || ('names' in file.descriptor && file.descriptor.names.includes(el))) {
            ready.push(el);
            added = true
            return;
          } else if ('value' in file.descriptor) { //symlink
            console.log({ file2: file })
            if (file.descriptor.name === el) {
              const divided = file.descriptor.value.split('/');
              if (divided[0] === '') ready = []
              ready.push(file.descriptor.value)
              added = true
              return;
            }
          }
        })
      }
      if (!added) ready.push(el);
    })

    return ready;
  }

  symlink(path: string, name: string) {

    const [blockNum] = this.selectFreeBlocks(1)

    const sym: ISymLinkDescriptor = { id: this.id, name: name, size: 1, type: 'symlink', blockMap: { links: [blockNum] }, value: path }

    this.memory[blockNum] = this.generateData();

    this.bitMap[blockNum] = 1; // the first block is used for the root directory
    this.id++;

    this.files.push({ descriptor: sym })
    this.files.map(_ => {
      if (this.workingDirectory.descriptor === _.descriptor.id && 'data' in _.descriptor) {
        _.descriptor.data.push({ descriptor: sym.id, name: sym.name })
      }
      return _
    })
  }

  private getFile(path: string) {
    let splitted = path.split('/')
    let file = splitted.pop()
    this.setWorkingDir(splitted.join('/'))
    if (file && this.isFileExistsInCurDir(file)) {
      return file;
    }

    return undefined;
  }

  private isFileExistsInCurDir(name: string): boolean {
    const curDesc = this.workingDirectory.descriptor;

    const curFolder = this.files.filter(_ => (curDesc === _.descriptor.id && _.descriptor.type === 'directory'))[0] as { descriptor: IDirectoryFileDescriptor }

    if (curFolder) {
      if (curFolder.descriptor.data.filter(tuple => tuple.name === name)[0]) {
        // console.log({ curFolder, name })
        return true
      } else {
        // console.log({ curFolder })
        return false
      }
    }
    return false;
  }

  private expandFile(name: string, intialBlocks: number, newSize: number): void {
    const requiredBlocks = this.calcBlocks(newSize) - intialBlocks;

    if (this.bitMap.filter(bit => !bit).length < requiredBlocks) {
      console.log('ERROR: Unable to expand the file as of luck of memory')
      return;
    }

    const freeBlocks = this.selectFreeBlocks(requiredBlocks)

    this.files = this.files.map(file => {
      const current = file;

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
        if ('names' in current.descriptor && current.descriptor.names.includes(name)) {
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
      const current = file
      if ('names' in current.descriptor && current.descriptor.names.includes(name)) {

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

  private isNameAlreadyTaken(name: string): boolean {
    let allNames: string[] = [];
    this.files.map(file => {
      if ('names' in file.descriptor) {
        return allNames.push(...file.descriptor.names)
      }
      return file
    })
    return allNames.includes(name)
  }

  private handleAlreadyTakenName() {
    console.log('The name is already taken')
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
          fs = new FileSystem(128, 4, 15);
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

        if (mounted) {
          const descNum = fs!.workingDirectory.descriptor
          fs!.files.map((file, i) => {

            if (file.descriptor.id === descNum) {
              // if ('names' in file.descriptor) {
              // console.log(`FileNames ${file.descriptor.names} with their descriptor ${i}`);
              // }
              if ('data' in file.descriptor) {
                console.log(`Directory: ${file.descriptor.name} with its descriptor: ${i}`)
                console.log(file.descriptor.data)
              }
            }
          })
        }
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

      case 'mkdir': {
        if (!mounted) break;
        const [name] = params;
        fs!.mkdir(name);
        break;
      }

      case 'rmdir': {
        if (!mounted) break;
        const [name] = params;
        fs!.rmdir(name);
        break;
      }

      case 'symlink': {
        if (!mounted) break;
        const [path, name] = params;
        fs!.symlink(path, name);
        break;
      }

      case 'pwd': {
        if (!mounted) break;
        console.log(fs!.workingDirectory.name);
        break;
      }

      case 'cd': {
        if (!mounted) break;
        const [name] = params;
        fs!.cd(name);
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
