const cors = (req, res, next) => {

  const whiteList = ['http://localhost:3000', 'http://localhost:5000', 'http://localhost']
  if (whiteList.indexOf(req.headers.origin) !== -1) {
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE, PATCH')
    res.header('Access-Control-Allow-Headers', 'Content-type, Authorization')
  }

  next()
}
module.exports = cors