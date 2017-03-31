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
const startPage = 1
const endPage = 100
const jsonFileName = './data/wallhaven-randon.json'

let secPageUrl = []
let allImgURL = []

// https://alpha.wallhaven.cc/random?page=
// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
const URL_TPL = num => `https://alpha.wallhaven.cc/random?page=${num}`

const genPagesURL = (start, end) => {
  let URLS = []
  for (let i = start; i <= end; i++) {
    URLS.push(URL_TPL(i))
  }
  return URLS
}

const PAGES_URL = genPagesURL(startPage, endPage)

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

async.mapLimit(PAGES_URL, thread, (url, cb) => getContent(url, data => getURL(data, 'a.preview', 'href', url => secPageUrl.push(url)), cb), (error, result) => {
  console.log('Get all page links!')
  async.mapLimit(secPageUrl, thread, (url, cb) => getContent(url, data => getURL(data, '#wallpaper', 'src', url => allImgURL.push(url)), cb), (err, rzt) => {
    console.log(chalk.green('Get all images links!'))
    const images = {}
    images.src = allImgURL
    fs.writeFileSync(jsonFileName, JSON.stringify(images))
  })
})
