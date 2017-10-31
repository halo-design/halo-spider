const colors = require('colors')
const cheerio = require('cheerio')
const inquirer = require('inquirer')
const puppeteer = require('puppeteer')

const requireLetterAndNumber = value => {
  if (/\w/.test(value) && /\d/.test(value)) {
    return true
  }
  return 'Password need to have at least a letter and a number'
}

const pageLoader = async () => {
  const answers = await inquirer.prompt([{
    type: 'password',
    message: 'Enter a password',
    name: 'password1',
    validate: requireLetterAndNumber
  }, {
    type: 'password',
    message: 'Enter a masked password',
    name: 'password2',
    mask: '*',
    validate: requireLetterAndNumber
  }])
  console.log(JSON.stringify(answers))
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
  console.log($('.result.c-container').eq(1).html())
  browser.close()
}

pageLoader()