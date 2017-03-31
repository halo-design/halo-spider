const request = require('request')
const cheerio = require('cheerio')
const mkdirp = require('mkdirp')
const async = require('async')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const prefixHeader = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
  'Connection': 'keep-alive'
}

const thread = 10
const output = './wallhaven'

let secPageUrl = []
let allImgURL = []

// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
const URL_TPL = num => `https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=${num}`

const genPagesURL = (start, end, dir) => {
  let URLS = []
  for (let i = start; i <= end; i++) {
    URLS.push(URL_TPL(i))
  }
  // create folder
  mkdirp(dir, err => err ? console.log(chalk.red(err)) : console.log(chalk.green(`${dir}:Folder created successfully!`)))
  return URLS
}

const PAGES_URL = genPagesURL(1, 20, output)

const getContent = (url, cb, cb1) => {
  const options = {
    url: url,
    headers: prefixHeader
  }
  console.log(chalk.yellow(`Start getting the page content：${options.url}`))
  request(options, (error, response, body) => {
    error => error ? console.log(chalk.red(error)) : console.log(chalk.green(`${options.url}:Get successfully!`))
    if (!error && response.statusCode == 200) {
      cb(body)
    }
    cb1 && cb1(null, null)
  })
}

const getURL = (data, filter, attr, everyCb) => {
  const $ = cheerio.load(data)
  let URL = []
  $(filter).each(function () {
    let lnk = $(this).attr(attr)
    lnk.indexOf('http') === -1 ?  lnk = `http:${lnk}` : null
    URL.push(lnk)
    everyCb && everyCb(lnk)
  })
  return URL
}

const downloadImage = (uri, cb) => {
  const dir = output
  request({
    uri: uri,
    encoding: 'binary'
  },
  (error, res, body) => {
    if (!error && res.statusCode == 200) {
      if (!body) {
          console.log(chalk.red('Unable to get content!'))
      }
      const fileName = `${Date.now()}&${~~(Math.random()*4000)}${uri.substr(-4, 4)}` 
      fs.writeFile(`${dir}/${fileName}`, body, 'binary', err => err ? console.log(chalk.red(err)) : console.log(chalk.green(`${fileName}:Image are downloaded over!`)))
    }
    cb && cb(null, null)
  })
}

async.mapLimit(PAGES_URL, thread, (url, cb) => getContent(url, data => getURL(data, 'a.preview', 'href', url => secPageUrl.push(url)), cb), (error, result) => {
  console.log('Get all page links!')
  async.mapLimit(secPageUrl, thread, (url, cb) => getContent(url, data => getURL(data, '#wallpaper', 'src', url => allImgURL.push(url)), cb), (err, rzt) => {
    console.log(chalk.green('Get all images links!'))
    console.log(chalk.yellow('Start downloading images!'))
    async.mapLimit(allImgURL, thread, (url, cb) => downloadImage(url, cb), (er, rz) => {
      console.log(chalk.green('All pictures are downloaded successfully!'))
    })
  })
})