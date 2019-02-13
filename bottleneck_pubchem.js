var csvjson = require('csvjson');
var path = require('path');
var fs = require('fs-extra');
var rp = require("request-promise");
var Bottleneck = require("bottleneck");

// Restrict us to one request per second
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 250
});

var data = fs.readFileSync(path.join(__dirname, 'chemicals_name.csv'), { encoding : 'utf8'})
var options = {
  delimiter : ',', // optional
  quote     : '"' // optional
};

function writeOutput() {
  fs.outputJSONSync('output.json', json, {spaces:2})
  // console.log(count)
}

let json = csvjson.toObject(data, options)
let hydrated = []

// var locations = ["London","Paris","Rome","New York","Cairo"];

// fire off requests for all locations
Promise.all(json.map(function (chemical) {

    // set up our request
    var options = {
        uri: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + chemical.chemical + '/cids/TXT',
        json: true
    };
    // console.log(options.uri)
    // run the api call. If we weren't using bottleneck, this line would have just been
    // return rp(options)
    //    .then(function (response) {...
    //
    return limiter.schedule(rp,options)
        .then(function (response) {
            // console.log('PubChem CID for ', chemical.chemical, ' is ', response);
            if (typeof(response) === 'string') {
              response = response.split('\n')
              response.length--
              response = Array.from(response, x => parseInt(x) )
            }
            hydrated.push(Object.assign(chemical, {'CID' : response}))
            // console.log(hydrated)
        })
        .catch(function (err) {
            // API call failed...
        })
}))
.then( (res) => {
  writeOutput()
}) 