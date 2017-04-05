const colors = require('colors')
const async = require('async')
const utils = require('./utils')
const parseString = require('xml2js').parseString
const cheerio = require('cheerio')

let secPageUrl = []
let allImgURL = []
let failedCount = 0


const PAGES_URL = utils.URLgenerator('https://1x.com/backend/loadmore.php?app=photos&from={{index}}&cat=all&sort=popular&userid=0', 2, 2, 30)

async.mapLimit(
  PAGES_URL,
  30,

  (url, cb) => utils.getContent(
    url,
    null,
    cb,
    data => {
      let dom = ''
      parseString(data, (err, result) => {
        dom = result.root.data[0]
      })
      utils.extractURL(dom, 'td > a.dynamiclink', 'href', url => {
        secPageUrl.push(url.replace(/http:/, 'https://1x.com'))
      })
    }
  ),

  (error, result) => {
    console.log(`Get ${PAGES_URL.length} pages link!`.green)

    async.mapLimit(
      secPageUrl,
      30, 
      
      (url, cb) => utils.getContent(
        url,
        null,
        cb,
        data => {
          const $ = cheerio.load(data)
          let param = eval(`[${$('#app_content-photo').html().split('onload="setupBasics(')[1].split('<img src="/images/system/image.gif"')[0].split(');">')[0].replace(/&apos;/g, "'")}]`)
          allImgURL.push(`https://1x.com${param[8]}`)
        }
      ), 

      (err, rzt) => {
        console.log(`Get ${failedCount} images link failed!`.red)
        console.log(`Get ${allImgURL.length - failedCount} images link successfully!`.green)
        utils.writeJSON('./data/1x.json', {src: allImgURL})
        utils.downloader({
          outputPath: './assets/1x',
          downloadQueue: allImgURL,
          thread: 15
        })
      }
    )
  }
)
