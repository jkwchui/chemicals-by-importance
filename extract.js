var csvjson = require('csvjson');
var path = require('path');
var fs = require('fs-extra');
const wiki = require('wikijs').default;
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 250);

let count = 0

var data = fs.readFileSync(path.join(__dirname, 'chemicals_name.csv'), { encoding : 'utf8'})
var options = {
  delimiter : ',', // optional
  quote     : '"' // optional
};

let json = csvjson.toObject(data, options)

function extractInfo(value, index) {
  limiter.removeTokens(1, function() {
    wiki().page(json[index].chemical)
    .then(page => page.info())
    .then(info => {
      Object.assign(json[index], info)
      count++
    })
  });
}

function writeOutput() {
  fs.outputJSONSync('output.json', json)
  console.log(count)
}

function extractArray() {
  json.forEach(extractInfo)
}

extractArray()

setTimeout(writeOutput, 5000)