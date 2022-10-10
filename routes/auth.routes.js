const Router = require('express')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const config = require('config')
const {check, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken')
const authMiddleware = require('../middleware/auth.middleware')
const router = Router()
const fileService = require('../services/fileService')
const File = require('../models/File')


router.post('/registration', [
  check('email', 'Uncorrect email').isEmail(),
  check('password', 'Password must be longer than 3 nd shorter than 12').isLength({min: 3, max: 12})
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({message: 'Uncorrect request', errors})
    }

    const {email, password} = req.body
    const candidate = await User.findOne({email})
    if (candidate) {
      return res.status(400).json({message: `User with email ${email} already exist`})
    }
    const hashedPassword = await bcrypt.hash(password, 8)
    const user = new User({email, password: hashedPassword})
    await user.save()
    
    await fileService.createDir(req, new File({user: user.id, name: ''}))
    
    return res.json({message: 'User was created'})
    
  } catch (error) {
    console.log(error)
    res.send({message: 'Server error'})
  }
})


router.post('/login', async (req, res) => {
  try {
    
    const {email, password} = req.body
    const user = await User.findOne({email})
    if (!user) {
      return res.status(404).json({message: 'User not found'})
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({message: 'Password invalid'})
    }
    const token = jwt.sign({id: user.id}, config.get('tokenSecretKey'), {expiresIn: '1h'})

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        diskSpace: user.diskSpace,
        usedSpace: user.usedSpace,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.log(error)
    res.send({message: 'Server error'})
  }
})

router.get('/auth', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({_id: req.user.id})

    const token = jwt.sign({id: user.id}, config.get('tokenSecretKey'), {expiresIn: '1h'})

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        diskSpace: user.diskSpace,
        usedSpace: user.usedSpace,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.log(error)
    res.send({message: 'Server error'})
  }
})


module.exports = router