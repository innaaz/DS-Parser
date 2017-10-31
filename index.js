// process.argv contains terminal command parameters, e.g. a command:
// node index /test
// would make process.argv equal to an array: ['node', 'index', '/test']
const directoryWithHtmlFiles = process.argv[2] 

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
    // parse the file content using cheerio
    const $ = cheerio.load(data)
    // create meta Hashmap
    const meta = {}
    // find all meta tags in the parsed html that contain necessary attributes
    $('meta[property], meta[name], meta[itemprop]').each(function(i, elem){
      const $elem = $(elem)
      // get property attribute of the meta tag
      const property = $elem.attr('property')
      // get name attribute
      const name = $elem.attr('name')
      // get itemprop attribute
      const itemprop = $elem.attr('itemprop')
      // get content attribute
      const content = $elem.attr('content')
      // extend the meta hashmap with a new key being one of (property, name or itemprop) 
      // and value being the content attribute
      meta[property || name || itemprop] = content
    })
  
    // convert to JSON-formatted string
    const json = JSON.stringify(meta, null, 2)
    // write the string to output folder of the project as .json
    fs.writeFile('output/' + fileStats.name.replace('.html','.json'), json, function(err) {
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