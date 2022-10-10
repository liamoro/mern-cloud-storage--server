const fileService = require('../services/fileService')
const config = require('config')
const fs = require('fs')
const User = require('../models/User')
const File = require('../models/File')
const path = require('path')
const Uuid = require('uuid')


class FileController {

  async createDir(req, res) {
    try {
      const {name, type, parent} = req.body
      const file = new File({name, type, parent, user: req.user.id})
      const parentFile = await File.findOne({_id: parent})

      if (!parentFile) {
        file.path = name
        await fileService.createDir(req, file)
      } else {
        file.path = path.join(parentFile.path, file.name)
        // file.path = `${parentFile.path}/${file.name}`
        await fileService.createDir(req, file)
        parentFile.childs.push(file._id)
        await parentFile.save()

      }
      await file.save()
      return res.json(file)
    } catch (e) {
      console.log(e)
      return res.status(400).json(e)
    }
  }



  async getFiles(req, res) {
    try {
      const {sort} = req.query

      let files
      switch (sort) {
        case 'name':
          files = await File.find({user: req.user.id, parent: req.query.parent}).sort({name:1})
          break;
        case 'type':
          files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type:1})
          break;
        case 'date':
          files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date:1})
          break;
      
        default:
          files = await File.find({user: req.user.id, parent: req.query.parent})
          break;
      }

      
      return res.json(files)
      
    } catch (e) {
      console.log(e)
      return res.status(500).json({message: 'Can not get file'})
    }
  }



  async uploadFile(req, res) {
    try {
      const file = req.files.file
      const parent = await File.findOne( {user: req.user.id, _id: req.body.parent} )
      const user = await User.findOne({_id: req.user.id})

      if (user.usedSpace + file.size > user.diskSpace) {
        return res.status(400).json({message: 'There no more space on the disk! '})
      }
      user.usedSpace += file.size


      let filePath, fileShortPath= file.name;

      if (parent) {
        fileShortPath = path.join(parent.path, file.name)
        filePath = path.join(req.filePath, req.user.id, fileShortPath)
      } else {
        filePath = path.join(req.filePath,req.user.id, fileShortPath)
      }
      if (fs.existsSync(filePath)) {
        return res.status(400).json({message: 'File already exist!'})
      }

      file.mv(filePath)

      const type = file.name.split('.').pop()

      const dbFile = new File({
        name: file.name,
        type,
        size: file.size,
        path: fileShortPath,
        parent: parent ? parent._id : null,
        user: user._id
      })

      await dbFile.save()
      await user.save()
      // console.log("All saved")
      // console.log("dbFile:::::::: ", dbFile)

      res.json(dbFile)
      // res.status(200).json({message: 'ok'})

    } catch (e) {
      console.log(e)
      return res.status(500).json({message: e})
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await File.findOne({_id: req.query.id, user: req.user.id})
      // const pathFile = path.join(req.filePath, req.user.id, file.path) 
      const pathFile = fileService.getPath(req, file)

      if (fs.existsSync(pathFile)) {
        return res.download(pathFile, file.name)
      }
      return res.status(400).json({'message': 'File was not fined'})
    } catch (e) {
      console.log(e)
      return res.status(500).json({'message': 'Download error'})
    }
    
  }
  async deleteFile (req, res) {

    try {
      const file = await File.findOne({_id: req.query.id, user: req.user.id})
      if (!file) {
        return res.status(400).json({message: 'File not found'})
      }

      fileService.deleteFile(req, file) // физически удаляем файл
      
      
      await file.remove() //удаляем из базы
      return res.json({message: `${file.name} was deleted`})



    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Dir is not empty'})
    }
    

  }

  async searchFiles (req, res) {
    try {

      const searchName = req.query.search

      let files = await File.find({user: req.user.id})
      files = files.filter(file => file.name.includes(searchName))
      return res.json(files)
      
    } catch (e) {
      console.log(e)
      return res.status(400).json('File was not fined')
    }

  }
  async uploadAvatar (req, res) {
    try {
      const file = req.files.file
      const user = await User.findById(req.user.id)
      const avatarName = Uuid.v4() + ".jpg"
      file.mv(path.resolve(config.get('staticPath'), avatarName))
      user.avatar = avatarName
      await user.save()

      return res.json(user)

    } catch (e) {
      console.log(e)
      return res.status(400).json('Upload avatar error')
    }

  }
  async deleteAvatar (req, res) {
    try {
      // const file = req.files.file
      const user = await User.findById(req.user.id)
      const avatarName = user.avatar
      fs.unlinkSync(path.resolve(config.get('staticPath'), avatarName))
      // file.mv(path.resolve(config.get('staticPath'), avatarName))
      user.avatar = null
      await user.save()

      return res.json(user)

    } catch (e) {
      console.log(e)
      return res.status(400).json('Delete avatar error')
    }

  }

}



module.exports = new FileController()