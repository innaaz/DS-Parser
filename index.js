// process.argv contains terminal command parameters, e.g. a command:
// node index /test
// would make process.argv equal to an array: ['node', 'index', '/test']
const directoryWithHtmlFiles = process.argv[2] 

const path = require('path')
// load cheerio module which is a fast and forgiving html parser
const cheerio = require('cheerio')
// load walk module which allows recursively reading files in a folder
const walk = require('walk')
// load fs (file system) model which contains functions to work with files, like read or write
const fs = require('fs')
// starting walking through the directory files
const walker = walk.walk(directoryWithHtmlFiles)

// process each file the walker finds in the directory
walker.on('file', function (root, fileStats, next) {
  // if the found file name doesn't end with .html then we skip it and go to the next one
  if (/\.html$/.test(fileStats.name) == false) {
    return next()
  }
  // read the file
  fs.readFile(root + '/' + fileStats.name, 'utf8', function (err,data) {
    if (err) {
      return console.log(err) 
    }
    // fix invalid script tags which for some reason are all like that in the available html files
    data = data.replace(/<script([^/]*)\/>/g, '<script$1></script>')
    // parse the file content using cheerio
    const $ = cheerio.load(data)
    // create Hashmap that will contain arrays of meta, link, script 
    const result = {meta: [], link: [], script: []}
    // find all meta tags in the parsed html and save their attributes in the result hashmap
    $('meta').each(function(i, elem){
      const attrs = $(elem).get(0).attribs
      result.meta.push(attrs)
    })
    // find all script tags extract filename from src attribute and add it to result hashmap
    $('script').each(function(i, elem){
      const attrs = $(elem).get(0).attribs
      const src = attrs.src
      if (src) {
        const filename = src.replace(/^[^?]*\/([^\/?]+).*$/, '$1')
        result.script.push(filename)
      }
    })
    // find all link taks and add them to result hashmap
    $('link').each(function(i, elem){
      const attrs = $(elem).get(0).attribs
      result.link.push(attrs)
    })
    result.title = $('title').text()
  
    // convert to JSON-formatted string
    const json = JSON.stringify(result, null, 2)
    const newFilePath = path.join(root, fileStats.name.replace('.html', '.json'))

    // write the string to output folder of the project as .json
    fs.writeFile(newFilePath, json, function(err) {
      if(err) {
        return console.log(err)
      }
      next()
    })
  })
})

walker.on("end", function () {
  console.log("all files saved")
})