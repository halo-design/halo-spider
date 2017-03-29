const fs = require('fs')
const request = require("request")
const cheerio = require("cheerio")
const mkdirp = require('mkdirp')

const options = {
	dir: './wallhaven',
	filterStyle: '.scrollbox img'
}
 
mkdirp(options.dir, err => err && console.log(err))

const download = (url, dir, filename, onClose, onError) =>
	request.head(url, (err, res, body) => {
		if (err) {
			onError(err)
		} else {
			const stream = request(url)
			stream
			.on('error', err => {
				console.log('无法下载！')
			})
			.pipe(fs.createWriteStream(`${dir}/${filename}`))
			.on('close', onClose)
			.on('error', err => {
				onError(err)
				stream.read()
			})
		}
	})

const reqByPage = (url, folder) => 
	request(url, (error, response, body) => {
		if (error) {
			console.log(error)
		} else if (response.statusCode == 200) {
			const $ = cheerio.load(body)
			let dir = options.dir
			$(options.filterStyle).each(function() {
				const $this = $(this)
				let src = $this.attr('src')
				src.indexOf('http') === -1 ?	src = `http:${src}` : null
				console.log(`开始下载：${src}`)
				if (folder) {
					dir = folder
					mkdirp(folder, err => err && console.log(err))
				}
				let fileName = `${Date.now()}${src.substr(-4, 4)}`
				download(src, dir, fileName, () => console.log(`${fileName}下载成功！`), err => console.log(`${fileName}下载失败！`))
			})
		}
	})

const getPagesArray = (prefix, index, folder) => {
	request(prefix + index, (error, response, body) => {
		if (error) {
			console.log(error)
		} else if (response.statusCode == 200) {
			const $ = cheerio.load(body)
			$('a.preview').each(function () {
				reqByPage($(this).attr('href'), folder)
			})
		}
	})
}

const reqAllPages = opt => {
	for (let i = 1; i <= opt; i++) {
		getPagesArray('https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=views&order=desc&page=', i, './wallhaven/views')
		getPagesArray('https://alpha.wallhaven.cc/search?categories=111&purity=100&sorting=favorites&order=desc&page=', i, './wallhaven/favorites')
	}
}

reqAllPages(10)
 
