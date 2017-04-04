const fs = require('fs')
const utils = require('./utils')

utils.downloader({
  outputPath: './assets/wallhaven-girls',
  downloadQueue: JSON.parse(fs.readFileSync('./data/wallhaven-girls.json')).src,
  thread: 15,
  startIndex: 0,
  endIndex: 30
})