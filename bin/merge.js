const request = require('request')
const cheerio = require('cheerio')
const colors = require('colors')
const mkdirp = require('mkdirp')
const async = require('async')
const path = require('path')
const fs = require('fs')


const images1 = JSON.parse(fs.readFileSync('./data/wallhaven-girls-1.json')).src
const images2 = JSON.parse(fs.readFileSync('./data/wallhaven-girls-2.json')).src
const images3 = JSON.parse(fs.readFileSync('./data/wallhaven-girls-3.json')).src

const ALL = {}
ALL.src = images1.concat(images2, images3)

fs.writeFileSync('./data/wallhaven-girls.json', JSON.stringify(ALL))
console.log('Merge successfully!'.green)
