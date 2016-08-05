#!/usr/bin/node
var request = require('request'),
    zlib = require('zlib'),
    fs = require('fs'),
    db = require('./lib/db.js'),
    Converter=require("csvtojson").Converter,
    out = fs.createWriteStream('/home/nicolas/ISCRAP/data/subtitles_day.txt'), 
csvConverter = new Converter({
constructResult:true,  // set to false if huge file
delimiter:"\t",
quote:"off",
toArrayString:true //set to true to get a JSON file  
  });

/**
*Download, decompress and parse the daily new subtitles from 
*http://dl.opensubtitles.org/addons/export/*
*/
var dll_stream = request('http://dl.opensubtitles.org/addons/export/subtitles_day.txt.gz')
.on('response', function(response){
  if (response.statusCode != 200){
  console.log("Incorrect ressource link, exiting now");
  process.exit(0);
  }
}).pipe(zlib.createGunzip()).pipe(out);
/**
*Convert the TAB text file to JSON
*/ 
dll_stream.on('finish', function () {
  //convert the TAB txt to JSON
var readStream = fs.createReadStream("./data/subtitles_day.txt");
var writeStream = fs.createWriteStream("./data/subtitles_day.json");
var jsonstream = readStream.pipe(csvConverter).pipe(writeStream);

  //when file is writting read it and call the seed db function
jsonstream.on('finish', function () {
var jsondata = fs.readFileSync("./data/subtitles_day.json");
doc = JSON.parse(jsondata);
seed(doc, 0)
});
});

/**
*Recursive loop that seed the subtitles one by one
*@param doc (The converted JSON stream)
*@param i (init index);
*/ 
function seed(doc, i) {
    if (i == doc.length) {
        console.log("---seeding complet---");
		process.exit();
    }
    if (i < doc.length) {
        doc[i]._id = doc[i].IDSubtitle;
        delete doc[i].IDSubtitle;
        delete doc[i].SubAddDate;
        delete doc[i].MovieFPS;
        delete doc[i].SubSumCD;
        delete doc[i].URL;

        db.seedNewSubTitles(doc[i], function(err) {
            if (err) {
				if (err.code == 11000) console.warn("Subtitle " + doc[i]._id + " already in database");
				else console.error("Error while saving subtitle ID: " + doc[i]._id + " to Subtitle Collection" + err);
                seed(doc, i + 1);
            } else seed(doc, i + 1);

        });
    };
}


  