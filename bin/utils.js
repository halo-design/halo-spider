const request = require('request')
const cheerio = require('cheerio')
const colors = require('colors')
const mkdirp = require('mkdirp')
const async = require('async')
const path = require('path')
const fs = require('fs')



exports.URLgenerator = (template, startNumber, endMunber) => {
  let URLS = []
  for (let i = startNumber; i <= endMunber; i++) {
    URLS.push(template.replace(/{{index}}/g, i))
  }
  return URLS
}

const prefixHeader = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
  'Connection': 'keep-alive'
}


exports.getContent = (url, reqTimeout, cb, successCb) => {
  const options = {
    url: url,
    headers: prefixHeader,
    timeout: reqTimeout ? reqTimeout : 40000
  }
  request(options, (error, response, body) => {
    if (error) {
      console.log(`[${error}] ${options.url} get failed!`.red)
      failedCount++
    } else if (response.statusCode == 200) {
      console.log(`${options.url}: Content get successfully!`.green)
      successCb(body)
    }
    cb && cb(null, null)
  })
}

exports.extractURL = (data, elementName, attr, eachCb) => {
  const $ = cheerio.load(data)
  let URL = []
  $(elementName).each(function () {
    let lnk = $(this).attr(attr)
    lnk.indexOf('http') === -1 ?  lnk = `http:${lnk}` : null
    URL.push(lnk)
    eachCb && eachCb(lnk)
  })
  return URL
}

exports.writeJSON = (path, obj) => {
  fs.writeFileSync(path, JSON.stringify(obj))
}

exports.readJSON = (path, obj) => {
  return JSON.parse(fs.readFileSync(path))
}


/************  options  ***************
 * 
 * @ param [String] outputPath
 * @ param [String] namePrefix
 * @ param [Array]  downloadQueue
 * @ param [Number] thread
 * @ param [Number] requestTimeout
 * @ param [Number] requestTimeout
 * @ param [Number] startIndex
 * @ param [Number] endIndex
 * @ param [Number] startNumber
 *
 */

exports.downloader = options => {
  const dir = options.outputPath
  const fileArray = options.downloadQueue
  const thread = options.thread || 10
  const reqTimeout = options.requestTimeout || 30000
  const startIndex = options.startIndex || 0
  const endIndex = options.endIndex || null
  const namePrefix = options.namePrefix || null

  let startNumber = options.startNumber || 1
  let failedCount = 0

  // create folder
  mkdirp(dir, err => err ? console.log(err.red) : console.log(`${dir} created successfully!`.green))

  const downImgList = endIndex === null 
  ? fileArray.slice(startIndex)
  : fileArray.slice(startIndex, endIndex)

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
          const fileName = `${startNumber}-${namePrefix ? namePrefix : Date.now()}${uri.substr(-4, 4)}` 
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
      startNumber++
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
}

