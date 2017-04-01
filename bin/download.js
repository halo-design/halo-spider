const request = require('request')
const cheerio = require('cheerio')
const colors = require('colors')
const mkdirp = require('mkdirp')
const async = require('async')
const path = require('path')
const fs = require('fs')

const dir = './assets/wallhaven-latest'
const file = './data/wallhaven-latest.json'
const images = JSON.parse(fs.readFileSync(file)).src
const thread = 10
const reqTimeout = 30000

const startIndex = 0
const endIndex = null

let index = 1
let failedCount = 0

// create folder
mkdirp(dir, err => err ? console.log(err.red) : console.log(`${dir} created successfully!`.green))

const downImgList = endIndex === null 
? images.slice(startIndex)
: images.slice(startIndex, endIndex)

const downloadImage = (uri, cb) => {
  request({
    uri: uri,
    encoding: 'binary',
    timeout: reqTimeout
  },
  (error, res, body) => {
    if (!error) {
      if (!body || res.statusCode !== 200) {
        console.log('Unable to get content!'.red)
        failedCount++
      } else {
        const fileName = `${index}-${Date.now()}${uri.substr(-4, 4)}` 
        fs.writeFile(`${dir}/${fileName}`, body, 'binary', err => {
          if (err) {
            console.log(err.red) 
          } else {
            console.log(`${fileName} are download over!`.green)
          }
        })
      }
    } else {
      console.log(`[${error}] Connection failed!`.red)
      failedCount++
    }
    index++
    cb && cb(null, null)
  })
}

console.log(`There are ${downImgList.length} pictures waiting to be downloaded...`.green)

async.mapLimit(
  downImgList, 
  thread, 
  (url, cb) => downloadImage(url, cb), 
  (err, rzt) => {
    console.log(`${downImgList.length - failedCount} pictures are download successfully!`.green)
    console.log(`${failedCount} picture download failed!`.red)
  }
)