const request = require('request')
const cheerio = require('cheerio')
const mkdirp = require('mkdirp')
const async = require('async')
const path = require('path')
const fs = require('fs')

const prefixHeader = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
  'Connection': 'keep-alive'
}

const output = './assets/jandan'

const URL_TPL = num => `http://jandan.net/ooxx/page-${num}#comments`

const generatePagesURL = (start, end, dir) => {
  let URLS = []
  for (let i = start; i <= end; i++) {
    URLS.push(URL_TPL(i))
  }
  // create folder
  mkdirp(dir, err => err ? console.log(err) : console.log(`${dir}:Folder created successfully!`))
  return URLS
}

const PAGES_URL = generatePagesURL(1800, 2000, output)

const getPageLnk = (url, cb, fn) => {
  const options = {
    url: url,
    headers: prefixHeader
  }
  console.log(`Start getting the page content：${options.url}`)

  request(options, (error, response, body) => {
    err => err ? console.log(err) : console.log(`${options.url}:Get successfully!`)
    if (!error && response.statusCode == 200) {
      fn(options.url, body)
      cb(null, null)
    }
  })
}

const downloadImage = (uri, filename, dir) => {
  request({
    uri: uri,
    encoding: 'binary'
  },
  (error, res, body) => {
    if (!error && res.statusCode == 200) {
      if (!body) {
          console.log("Unable to get content!")
      } 
      fs.writeFile(`${dir}/${filename}`, body, 'binary', err => err ? console.log(err) : console.log(`${dir}/${filename}:Image are downloaded over!`))
    }
  })
}

const analysisPageURL = (parentURL, data) => {
  const $ = cheerio.load(data)
  let imgURL = [] 
  $('.commentlist .row .text p a').each(function () {
    let href = $(this).attr('href')
    href.indexOf('http') === -1 ?  href = `http:${href}` : null
    imgURL.push(href)
    const fileName = `${Date.now()}&${~~(Math.random()*4000)}${href.substr(-4, 4)}`
    downloadImage(href, fileName, output)
  })
  console.log(`Get ${imgURL.length} images!`)
}


async.eachSeries(PAGES_URL, (url, cb) => getPageLnk(url, cb, analysisPageURL), (err, rzt) => console.log('Get all page links!'))
