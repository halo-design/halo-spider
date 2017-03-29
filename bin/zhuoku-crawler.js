const fs = require('fs')
const request = require("request")
const cheerio = require("cheerio")
const mkdirp = require('mkdirp')

const options = {
	dir: './zhuoku',
	filterStyle: '#imageview'
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

const getPagesArray = (index, folder) => {
	request(`http://www.zhuoku.com/zhuomianbizhi/jingxuan/index-${index}.htm`, (error, response, body) => {
		if (error) {
			console.log(error)
		} else if (response.statusCode == 200) {
			let $ = cheerio.load(body)
			$('#liebiao .bizhiin a').each(function () {
				let href1 = $(this).attr('href')
				href1.indexOf('http') === -1 ?	href1 = `http://www.zhuoku.com/${href1}` : null
				request(href1, (error, response, body) => {
					if (error) {
						console.log(error)
					} else if (response.statusCode == 200) {
						let $ = cheerio.load(body)
						$('.bizhiin a').each(function () {
							href2 = `${href1.replace(/[^\/]+$/, '')}${$(this).attr('href')}`
							reqByPage(href2, folder)
						})
					}
				})
			})
		} else {
			console.log('运行中断！')
		}
	})
}

const reqAllPages = opt => {
	for (let i = 1; i <= opt; i++) {
		getPagesArray(i)

	}
}

reqAllPages(1)
 
// 需要处理高并发问题 参考：http://www.jb51.net/article/79438.htm