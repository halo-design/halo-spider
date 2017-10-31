const colors = require('colors')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const pageLoader = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://baidu.com')
  await page.type('#kw', 'puppeteer')
  await page.click('#su')
  await page.waitFor(2000)
  const context = await page.evaluate(() => document.documentElement.outerHTML)
  const $ = cheerio.load(context, {
    decodeEntities: false
  })
  // console.log(context)
  console.log($('.result.c-container').eq(1).html())
  browser.close()
}

pageLoader()