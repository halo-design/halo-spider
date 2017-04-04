const utils = require('./utils')

const images1 = utils.readJSON('./data/wallhaven-favorites.json').src
const images2 = utils.readJSON('./data/wallhaven-latest.json').src
const images3 = utils.readJSON('./data/wallhaven-random.json').src

utils.writeJSON('./data/wallhaven-all.json', {src: [].concat(images1, images2, images3)})
console.log('Merge successfully!'.green)
