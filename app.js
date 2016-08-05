var config = require('./config.js')
	//, downloader = require('./modules/subtitlesDownloader.js')
	, zipUploader = require('./modules/zipUploader.js')
	, populater = require('./modules/movieCollectionPopulater.js')
	, WPposter = require('./modules/wpPoster.js')
	, SSHdownloader = require('./modules/SSHsubtitlesDownloader.js')
	, db     = require('./lib/db.js')
	, aws = require('./modules/awsManager.js')
	, count = 0	
	, now = Math.floor(Date.now() / 1000)
	, log4js = require('log4js');

log4js.configure({
	appenders: [
	{type: 'console'},
	{type: 'file', filename: 'logs/'+now+'.log'}
	],
	replaceConsole: true
});
var logger = log4js.getLogger();

function finished(err) {
	if (err) console.log("Error: " + err);
	process.exit();
}


		  
// db.findSubTitlesToDownloadToHandleManualy(function(err, doc){
	// if (err) console.log(err);
	// else {
	// db.saveSubtitlesWithError(doc, function(err) {
            // if(err) {
              // console.log("Error while saving subtitles with error to error collection");
              // doc.error = err;
            // } else
              // return db.removeSubTitlesToDownload(doc, finished);
          // });
	// };
	
// });
main();
function main(){
if (count == 300) finished();

	db.cleanInstanceBackList(function(err, data){
		if (err){
			console.log("Error cleaning instance black list " + err);
		}

		aws.create(function(ip, err){
			console.log("--- Instance number: " + count + " ---");
			count++
			if (err){
				console.log("Error with AWS manager " + err);
				aws.killAll(finished);
			}

			SSHdownloader.Download(ip, function(err){
				if (err){
					console.log("Error with SSHdownloader: " + err)
					aws.killAll(finished);
				}
				aws.killAll(function(err, data){
					if (err) {
						console.log(err)
					}

					zipUploader.ZipUpload(function(err, data) {
						if (err) {
							console.log("Error with zipUploader: "+err)
						}

						db.saveMovieCollection(function(err, data) {
							if (err) {
								console.log("Error with movieCollection aggregator: "+err)
							}

							db.saveTonewSubtitlesToPublish(function (err, data) {
								if (err) {
									console.log("Error news to publish generator: "+err)
								}	
								populater.Populate(config.populate.size, (function(err, data) {
									if (err) {
										console.log("Error with the scrapper: "+err)
									}

									db.dropSubtitleDownloaded(function(err, data){
										if (err) {
											console.log("Error with dropSubtitleDownloaded: "+err)
										}						

										WPposter.Post(function(err, data){
											if (err){
												console.log("Error with the wordpress poster: " + err)
											}
											main();
										});
									});
								}));
							});
						});
					});
				});

			});
		});
	});
};