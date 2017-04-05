const colors = require('colors')
const async = require('async')
const utils = require('./utils')
const parseString = require('xml2js').parseString
const cheerio = require('cheerio')

let secPageUrl = []
let allImgURL = []
let failedCount = 0

const popular = 'https://1x.com/backend/loadmore.php?app=photos&from={{index}}&cat=all&sort=popular&userid=0'
const architecture = 'https://1x.com/backend/loadmore.php?app=photos&from={{index}}&cat=architecture&sort=popular&userid=0'
const conceptual = 'https://1x.com/backend/loadmore.php?app=photos&from={{index}}&cat=conceptual&sort=popular&userid=0'
const landscape = 'https://1x.com/backend/loadmore.php?app=photos&from={{index}}&cat=landscape&sort=popular&userid=0'

const PAGES_URL = utils.URLgenerator(landscape, 1, 100, 30)

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
        utils.writeJSON('./data/1x-landscape.json', {src: allImgURL})
        utils.downloader({
          outputPath: './assets/1x-landscape',
          downloadQueue: allImgURL,
          thread: 15
        })
      }
    )
  }
)
