const request = require('request')
const cheerio = require('cheerio')
const colors = require('colors')
const mkdirp = require('mkdirp')
const async = require('async')
const path = require('path')
const fs = require('fs')
const downloader = require('./downloader')

const prefixHeader = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
  'Connection': 'keep-alive'
}

const thread = 50
const startPage = 0
const endPage = 20
const jsonFileName = './data/wallhaven-random.json'

const reqTimeout = 40000

let secPageUrl = []
let allImgURL = []

let failedCount = 0

// https://alpha.wallhaven.cc/random?page=
// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=111&purity=110&sorting=favorites&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=001&purity=100&sorting=favorites&order=desc&page=
// https://alpha.wallhaven.cc/latest?page=
const URL_TPL = num => `https://alpha.wallhaven.cc/random?page=${num}`

const genPagesURL = (start, end) => {
  let URLS = []
  for (let i = start; i <= end; i++) {
    URLS.push(URL_TPL(i))
  }
  return URLS
}

const PAGES_URL = genPagesURL(startPage, endPage)

const getContent = (url, cb, hookCb) => {
  const options = {
    url: url,
    headers: prefixHeader,
    timeout: reqTimeout
  }
  request(options, (error, response, body) => {
    if (error) {
      console.log(`[${error}] ${options.url} get failed!`.red)
      failedCount++
    } else if (response.statusCode == 200) {
      console.log(`${options.url}: Content get successfully!`.green)
      cb(body)
    }
    hookCb && hookCb(null, null)
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

async.mapLimit(
  PAGES_URL,
  thread,

  (url, cb) => getContent(
    url, 
    data => getURL(data, 'a.preview', 'href', url => secPageUrl.push(url)), 
    cb
  ),

  (error, result) => {
    console.log(`Get ${PAGES_URL.length} pages link!`.green)

    async.mapLimit(
      secPageUrl, 
      thread, 
      
      (url, cb) => getContent(
        url, 
        data => getURL(data, '#wallpaper', 'src', url => allImgURL.push(url)), 
        cb
      ), 

      (err, rzt) => {
        console.log(`Get ${failedCount} images link failed!`.red)
        console.log(`Get ${allImgURL.length - failedCount} images link successfully!`.green)
        const images = {}
        images.src = allImgURL
        fs.writeFileSync(jsonFileName, JSON.stringify(images))
        downloader({
          outputPath: './assets/wallhaven-random',
          downloadQueue: allImgURL,
          thread: 15
        })
      }
    )
  }
)
