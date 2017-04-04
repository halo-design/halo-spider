const colors = require('colors')
const async = require('async')
const utils = require('./utils')


let secPageUrl = []
let allImgURL = []
let failedCount = 0

// https://alpha.wallhaven.cc/random?page=
// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=111&purity=110&sorting=favorites&order=desc&page=
// https://alpha.wallhaven.cc/search?categories=001&purity=100&sorting=favorites&order=desc&page=
// https://alpha.wallhaven.cc/latest?page=


const PAGES_URL = utils.URLgenerator('https://alpha.wallhaven.cc/search?categories=001&purity=100&sorting=date_added&order=desc&page={{index}}', 0, 5)

async.mapLimit(
  PAGES_URL,
  50,

  (url, cb) => utils.getContent(
    url,
    null,
    cb,
    data => utils.extractURL(data, 'a.preview', 'href', url => secPageUrl.push(url))
  ),

  (error, result) => {
    console.log(`Get ${PAGES_URL.length} pages link!`.green)

    async.mapLimit(
      secPageUrl,
      50, 
      
      (url, cb) => utils.getContent(
        url,
        null,
        cb,
        data => utils.extractURL(data, '#wallpaper', 'src', url => allImgURL.push(url)) 
      ), 

      (err, rzt) => {
        console.log(`Get ${failedCount} images link failed!`.red)
        console.log(`Get ${allImgURL.length - failedCount} images link successfully!`.green)
        utils.writeJSON('./data/wallhaven-latest.json', {src: allImgURL})
        utils.downloader({
          outputPath: './assets/wallhaven-latest',
          downloadQueue: allImgURL,
          thread: 15
        })
      }
    )
  }
)
