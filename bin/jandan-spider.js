const colors = require('colors')
const async = require('async')
const utils = require('./utils')


let allImgURL = []
let failedCount = 0


const PAGES_URL = utils.URLgenerator('http://jandan.net/ooxx/page-{{index}}#comments', 2400, 2422)

async.mapLimit(
  PAGES_URL,
  50,

  (url, cb) => utils.getContent(
    url,
    null,
    cb,
    data => utils.extractURL(data, '.commentlist .row .text p a', 'href', url => allImgURL.push(url))
  ),

  (error, result) => {
    console.log(`Get ${failedCount} images link failed!`.red)
    console.log(`Get ${allImgURL.length - failedCount} images link successfully!`.green)
    utils.writeJSON('./data/jandan.json', {src: allImgURL})
    utils.downloader({
      outputPath: './assets/jandan',
      downloadQueue: allImgURL,
      thread: 30
    })
  }
)
