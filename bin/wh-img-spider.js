const request = require('request')
const cheerio = require('cheerio')
const mkdirp = require('mkdirp')
const async = require('async')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

let index = 0
const dir = './wallhaven'
const file = './wallhaven.json'
const images = JSON.parse(fs.readFileSync(file)).src

// create folder
mkdirp(dir, err => err ? console.log(chalk.red(err)) : console.log(chalk.green(`${dir}:Folder created successfully!`)))

const downImgList = images.slice(0)

const downloadImage = (uri, cb) => {
  request({
    uri: uri,
    encoding: 'binary'
  },
  (error, res, body) => {
    if (!error && res.statusCode == 200) {
      if (!body) {
          console.log(chalk.red('Unable to get content!'))
      }
      const fileName = `${index}-${Date.now()}${uri.substr(-4, 4)}` 
      fs.writeFile(`${dir}/${fileName}`, body, 'binary', err => {
        if (err) {
          console.log(chalk.red(err)) 
        } else {
          console.log(chalk.green(`${fileName}:Image are downloaded over!`))
          index++
        }
      })
    }
    cb && cb(null, null)
  })
}

console.log(chalk.green(`There are ${downImgList.length} pictures waiting to be downloaded...`))
async.mapLimit(downImgList, 10, (url, cb) => downloadImage(url, cb), (err, rzt) => console.log(chalk.green('All pictures are downloaded successfully!')))