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

// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
const URL_TPL = num => `https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=${num}`

const generatePagesURL = (start, end, dir) => {
  let URLS = []
  for (let i = start; i <= end; i++) {
    URLS.push(URL_TPL(i))
  }
  // create folder
  mkdirp(dir, err => err ? console.log(err) : console.log(`${dir}:Folder created successfully!`))
  return URLS
}

const PAGES_URL = generatePagesURL(1, 10, './wallhaven')

const getPageLnk = (url, cb, fn) => {
  const options = {
    url: url,
    headers: prefixHeader
  }
  console.log(`Start getting the page content：${options.url}`)

  request(options, (error, response, body) => {
    err => err ? console.log(err) : console.log(`${options.url}:Get successfully!`)
    if (!error && response.statusCode == 200) {
      fn(options.url, body, cb)
    } else {
      cb()
    }
  })
}

const downloadImage = (uri, filename, dir, cb2) => {
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
    cb2(null, null)
  })
}

const analysisThirdPageURL  = (parentURL, data, cb2) => {
  const $ = cheerio.load(data)
  let imgURI = $('#wallpaper').attr('src')
  imgURI.indexOf('http') === -1 ?  imgURI = `http:${imgURI}` : null
  const fileName = `${Date.now()}&${~~(Math.random()*4000)}${imgURI.substr(-4, 4)}`
  downloadImage(imgURI, fileName, './wallhaven', cb2)
}

const analysisSecondaryPageURL = (parentURL, data, cb1) => {
  const $ = cheerio.load(data)
  let secPagesURL = [] 
  $('a.preview').each(function () {
    let href = $(this).attr('href')
    secPagesURL.push(href)
    // getPageLnk(href, () => {}, analysisThirdPageURL)
  })
  console.log(`'Get ${secPagesURL.length} secondary pages!`)
  async.mapLimit(secPagesURL, 30, (url, cb2) => getPageLnk(url, cb2, analysisThirdPageURL), (err, rzt) => {
    console.log('Get all secondary pages links!')
    cb1(null, null)
  })
}


async.eachSeries(PAGES_URL, (url, cb1) => getPageLnk(url, cb1, analysisSecondaryPageURL), (err, rzt) => console.log('Get all page links!'))
