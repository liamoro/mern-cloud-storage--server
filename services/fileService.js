const fs = require('fs')
const File = require('../models/File')
const path = require('path')
const config = require('config')

class FileService {


  createDir(req, file) {
    const filePath = this.getPath(req, file)

    return new Promise(((resolve, reject) => {
      try {
        const fileExists = fs.existsSync(filePath)
        if (!fileExists) {
          fs.mkdirSync(filePath)
          return resolve({message: 'File was created'})
        } else {
          return reject({message: 'File already exists'})
        }
        
      } catch (e) {
        // console.log('fileServer::: ', e.message)
        return reject({message: 'File error'})
      }
    }))
  }
  deleteFile (req, file) {
    const filepath = this.getPath( req, file)

    file.type === 'dir' ? fs.rmSync(filepath, {recursive: true}) : fs.rmSync(filepath)

  }
  getPath (req, file ){
    return path.resolve(req.filePath, file.user.toString(), file.path)
  }

}


module.exports = new FileService()