var csvjson = require('csvjson');
var path = require('path');
var fs = require('fs-extra');
const wiki = require('wikijs').default;
// var RateLimiter = require('limiter').RateLimiter;

// var limiter = new RateLimiter(4, 'minute');
const axios = require('axios');
const Bottleneck = require("bottleneck");
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 333
});

var data = fs.readFileSync(path.join(__dirname, 'chemicals_name.csv'), { encoding : 'utf8'})
var options = {
  delimiter : ',', // optional
  quote     : '"' // optional
};

let json = csvjson.toObject(data, options)

const wrapped = limiter.wrap(extractInfo);

async function extractInfo(value, index) {
  console.log('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + json[index].chemical + '/cids/TXT')
  await axios.get('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + json[index].chemical + '/cids/TXT')
    .then(res => {
      let data = res.data
      if (typeof(data) === 'string') {
        data = data.split('\n')
        data.length--
        data = Array.from(data, x => parseInt(x) )
      }
      Object.assign(json[index], {'CID' : data})
      // console.log(json[index])
    })
  }

// function extractInfo(value, index) {
//   limiter.removeTokens(1, function() {
//     wiki().page(json[index].chemical)
//     .then(page => page.info())
//     .then(info => {
//       Object.assign(json[index], info)
//       count++
//     })
//   });
// }

function writeOutput() {
  fs.outputJSONSync('output.json', json)
  // console.log(count)
}

async function processArray(array) {
  for (const item of array) {
      await wrapped(item);
    }
  }
  writeOutput()
  console.log('Done!');
}

// function extractArray() {
//   for (json.forEach(extractInfo)
//   limiter.removeTokens(1, function() {
  
//   }
// }

processArray()
// setTimeout(writeOutput, 8000000)