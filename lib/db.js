var config   = require('../config.js')
  , ObjectId = require('mongodb').ObjectID
  , Monk     = require('monkii')
  , iscrapDB = Monk(config.mongo.connectUrl)
  ,	fs 	   = require('fs');

var log4js = require('log4js');


console.log("> Connected to mongoDB.");
console.log("");

// --| On Exit close all database
process.on('exit', function (){
  iscrapDB.close();

  console.log("");
  console.log('> MongoDB closed.');
});

// --|  Collections
var subTitlesDownloaded = iscrapDB.get('subTitlesDownloaded');
var subTitlesToDownload = iscrapDB.get('subTitlesToDownload');
var movieCollectionTmp = iscrapDB.get('movieCollectionTmp');
var movieCollectionToComplete = iscrapDB.get('movieCollectionToComplete');
var movieCollection = iscrapDB.get('movieCollection');
var newSubtitlesToPublish = iscrapDB.get('newSubtitlesToPublish');
var websites = iscrapDB.get('websites');
var newSubtitlesToPublishTemp = iscrapDB.get('newSubtitlesToPublishTemp');
var subTitlesCollection = iscrapDB.get('subTitlesCollection');
var awsCollection = iscrapDB.get('awsCollection');
var subtitlesWithError = iscrapDB.get('subtitlesWithError');

/** @module Database Library */
// --|  Helpers

/**
 * Get a list of Subtitles to download from ToDownload Collection
 * @param limit (number of subtitle to retrieve)
 */
var findSubTitlesToDownload = function(limit, callback) {
  subTitlesToDownload.find({}, {limit: limit, sort: {_id: 1}}, callback);
}

/**
 * Get a list of French Subtitles for movie to download from ToDownload Collection
 * use for the POC
 * @param limit (number of subtitle to retrieve)
 */
var findFrenchMovieSubTitlesToDownload = function(limit, callback) {
	var query = {ISO639: "fr", MovieKind: "movie"};
  subTitlesToDownload.find(query, {limit: limit, sort: {_id: 1}}, function(err, docs) {
		if(err) {
			console.error("Error trying to get movie in french to download: " + err);
			return callback(err, docs);
		};
		return callback(null, docs);
		
	});
};

/**
* Get the whole subTitlesDownloaded collection
*/
var findSubTitlesDownloaded = function(callback){
	subTitlesDownloaded.find({}, callback);

} 

/**
* Get the movieCollectionToComplete collection 
* @param limit (number of movies to work with)
*/
var findMoviesToPopulate = function(limit, callback){
	movieCollectionToComplete.find({}, {limit: limit, sort: {_id: 1}}, callback);
}

/**
* Get the websites in databse
*/
var findwebsiteToPublishTo = function(callback){
	websites.find({}, callback);
}

/**
* Get the whole movieCollectionToComplete collection 
*/
var findmovieCollectionToComplete = function(callback){
	movieCollectionToComplete.find({}, callback);
}

/**
* Get the whole movieCollectionTmp collection 
*/
var findmovieCollectionTmp = function(callback){
	movieCollectionTmp.find({}, callback);
}

/**
* Find all ec2 AWS instance from awsCollection
*/
var findAwsInstance = function(callback){
	awsCollection.find({}, callback);
}

/**
* TODO
* Find subtitles that are not corretyle save to database
* "field18" is for "MovieYear"
*/
var findSubTitlesToDownloadToHandleManualy = function(callback){
	subTitlesToDownload.find( {field18: {
		$gt: 1800
	}}, {limit: 100}, callback);
}

/**
* Find an ec2 AWS instance from awsCollection
*@param ip (ip adresse from the instance)
*/
var findAwsInstanceByIp = function(ip, callback){
	var query = {ip: ip};	
	awsCollection.find(query, function(err, doc) {
		if(err) {
			console.error("Error trying to get instancebyip: " + err);
			return callback(err, doc);
		};
		return callback(null, doc);
		
	});
};

/**
*Get subtitles to publish for a given lang
*@param lang (in ISO639 format)
*/
var findNewSubtitlesByLang = function(lang, callback){	

	var query = {ISO639 : lang};
	newSubtitlesToPublish.find(query, function(err, docs) {
		if(err) {
			console.error("Error in newSubtitlesToPublish: " + err);
			return callback(err, docs);
		};
		
		console.log("Found: " + docs.length+ " subtitles for lang: "+ lang);
		return callback(null, docs);
		
	});
};

/**
*Get subtitles for a movie given its ImdbID
*@param ImdbID 
*/
var findSubTitlesByImDBid = function(ImdbID, callback){	

	var query = {ImdbID : ImdbID};
	newSubtitlesToPublish.find(query, function(err, docs) {
		if(err) {
			console.error("Error in newSubtitlesToPublish: " + err);
			return callback(err, docs);
		};
		
		console.log("Found: " + docs.length+ " subtitles for Imdbid: "+ ImdbID);
		return callback(null, docs);
		
	});
};

/**
*Save the subtitles for a given lang to the final subTitlesCollection
*@param lang
*/
var saveToSubtitlesCollection = function(lang, callback){
	var query = {ISO639 : lang};
	newSubtitlesToPublish.find(query, function(err, docs){
		if (err){
			return callback(err);
		}
		subTitlesCollection.insert(docs, function(err){
				if (err){
					console.error("Error with save to subTitlesCollection: "+err);
					return callback(err);
				};
				console.log("saveTo subTitlesCollection success");
				return callback(null);
			});

	});

};

/**
*Remove the subtitles for a given lang from the newSubtitlesToPublish collection
*@param lang
*/
var removeNewSubtitlesByLang = function(lang, callback) {
	var query = {ISO639 : lang};
	newSubtitlesToPublish.remove(query, function(err, res) {
		if(err) {
			return callback(err, lang);
		};
		console.log("Success removing newsToPublish for lang: " + lang);
		return callback(null, lang);
	});
};

/**
 * Remove Subtitle from ToDownload Collection
 */
var removeMovieToComplete = function(doc, callback) {
	var query = {_id: doc._id};
	movieCollectionToComplete.remove(query, function(err, res) {
		if(err) {
			console.error("Error removing document ID " + doc._id + " from movieCollectionToComplete: " + err);
			doc.error = err;
			return callback(err, doc);
		};
		console.log("Document ID " + doc._id + " removed from movieCollectionToComplete");
		return callback(null, doc);
	});
};


/**
*Remove a movie from movieCollection use for 
*Manuel "upsert" since monk doesnt handle it
*/

var removeMovieInMovieCollectionById = function(doc, callback){
	var query = {_id: doc._id};
	movieCollection.remove(query, function(err, res) {
		if(err) {
			console.error("Error removing document ID " + doc._id + " from movieCollection: " + err);
			doc.error = err;
			return callback(err, doc);
		};
		console.log("Document ID " + doc._id + " removed from movieCollection");
		return callback(null, doc);
	});
};

/**
 * Save Subtitle entry to Downloaded collection
 */
var saveToMovieCollection = function(doc, callback) {
	movieCollection.insert(doc, function(err, result) {
		if(err) {
			console.error("Error saving doc ID " + doc._id + ": " + err);
			return callback(err, doc);
		}
			console.log("Document ID " + doc._id + " saved");
		return callback(null, doc);
	});

};

/**
* Remove ec2 AWS instance from the awsCollection that are older that 24H
*/
var cleanInstanceBackList = function(callback){


	findAwsInstance(function(err, docs){

		if (err) console.error("Error getting instancesInfo from db -- " + err);
		else {
			if (docs.length == 0) {
				console.log("Instance list is empty")
				return callback(null)
			};
		for (i=0; i<docs.length; i++) {
			if (Date.now() - docs[i].timestamp > 86400000) {				
				var query = {_id: docs[i]._id};
				awsCollection.remove(query, function(err, res){
					if(err){
						console.error("Error removing instance from black list " + err);
						return callback(err);
					};
					console.log("Sucess removing instance from black list ");

				});
			};
			if (i == docs.length-1) return callback(null);
		}
		}
	 
});
};

/**
* Save ec2 AWS instance info to the awsCollection
*@param doc (the document to save)
*/
var saveInstanceInfo = function(doc, callback){
	awsCollection.insert(doc, function(err, result) {
		if(err){
			console.error("Error saving instanceInfo with id: " + doc._id + ": " + err);
			return callback(err, doc);
		}
		console.log("instanceInfo succesfully saved for id: " + doc._id);
		return callback(null, doc);
	})
}

/**
*Save subtitles to the toPublish collection
*/
var saveTonewSubtitlesToPublish = function(callback){
	findSubTitlesDownloaded(function(err, docs){
		if (err) console.error("Error with the findSubTitlesDownloaded: " + err);
		else 
			newSubtitlesToPublish.insert(docs, function(err){
				if (err){
					console.error("Error with saveTonewSubtitlesToPublish: "+err);
					return callback(err);
				};
				console.log("saveTonewSubtitlesToPublish success");
				return callback(null);
			});
	});
};


/**
 * Remove Subtitle from ToDownload Collection
 *@param doc (the subtile to delet)
 */
var removeSubTitlesToDownload = function(doc, callback) {
	var query = {_id: doc._id};
	subTitlesToDownload.remove(query, function(err, res) {
		if(err) {
			console.error("Error removing document ID " + doc._id + " from subTitlesToDownload: " + err);
			doc.error = err;
			return callback(err, doc);
		};
		console.log("Document ID " + doc._id + " removed from subTitlesToDownload");
		return callback(null, doc);
	});
};

/**
* Drop subtitleDownloaded collection (called once succesfully aggregated)
*/
var dropSubtitleDownloaded = function (callback){
	subTitlesDownloaded.drop(function(err, res){
		if(err){
			console.error("Error droping collection subtitleDownloaded");
			return callback(err);
		};
		console.log("Collection subtitleDownloaded succefully dropped");
		return callback(null)
	});
};


/**
 * Increment Subtitle Error counter in ToDownload Collection
 */
var incrementSubTitlesToDowloadErrorCount = function(doc, callback) {
  var query = {_id: doc._id};
  if (!doc.errorCount) doc.errorCount = 0;
  subTitlesToDownload.update(query, {'$set': {errorCount: doc.errorCount + 1}}, function(err, res) {
    if(err) {
      doc.error = err;
      console.error("Error updating subtitle ID " + doc._id + " from collection subTitlesToDownload: " + err);
      return callback(err, doc);
    };
    console.log("Subtitle ID " + doc._id + " error counter has been incremented");
    return callback(null, doc);
  });
};
/**
 * Save Subtitle entry to Downloaded collection
 */
var saveSubTitleDownloaded = function(doc, callback) {

	subTitlesDownloaded.insert(doc, function(err, result) {
		if(err) {
			console.error("Error saving doc ID " + doc._id + ": " + err);
			doc.error = err;
			return callback(err, doc);
		}
		console.log("Document ID " + doc._id + " saved");

		return callback(null, doc);
	});

};

/**
 * Save SubtitleWithError to subtitlesWithError Collection
 */
var saveSubtitlesWithError = function(doc, callback) {

	subtitlesWithError.insert(doc ,function(err, result) {
		if(err) {
			console.error("Error saving subtitles with error to subtitlesWithError collection: " + err);
			doc.error = err;
			return callback(err, doc);
		}
		console.log("Subtiles to handle manualy sucessfuly saved to subtitlesWithError collection");

		return callback(null, doc);
	});

};

/**
 *Save the akas for a given movie to movieCollectionToComplete collection
 *@param movieId (imdbid)
 *@param akas (array of akas)
 */
var saveMovieAkas = function(movieId, akas, callback) {
	var query = {_id: movieId};
	movieCollectionToComplete.update(query, {'$set': {akas: akas}}, function(err, res) {
		if(err) {
			console.error("Error saving the akas for movie with id: " + movieId+"-- error: " + err);
			return callback(err, movieId);
		};
		console.log("Succes saving the akas for movie with id: " + movieId);
		return callback(null, movieId);
	});
};

/**
 *Save the actor for a given movie to movieCollectionToComplete collection
 *@param movieId (imdbid)
 *@param actor (scrapping result to save)
 */
var saveMovieActor = function(movieId, actor, callback) {
	var query = {_id: movieId};
	movieCollectionToComplete.update(query, {'$set': {actors: actor}}, function(err, res) {
		if(err) {
			console.error("Error saving the actor for movie with id: " + movieId+"-- error: " + err);
			return callback(err, movieId);
		};
		console.log("Succes saving the actor for movie with id: " + movieId);
		return callback(null, movieId);
	});
};

/**
 *Save the director for a given movie to movieCollectionToComplete collection
 *@param movieId (imdbid)
 *@param director (scrapping result to save)
 */
var saveMovieDirector = function(movieId, director, callback) {
	var query = {_id: movieId};
	movieCollectionToComplete.update(query, {'$set': {director: director}}, function(err, res) {
		if(err) {
			console.error("Error saving the director for movie with id: " + movieId + "-- error: " + err);
			return callback(err, movieId);
		};
		console.log("Succes saving the director for movie with id: " + movieId);
		return callback(null, movieId);
	});
};

/**
 *Save the akas for a given movie to movieCollectionToComplete collection
 *@param movieId (imdbid)
 *@param genres (array of genres)
 */
var saveMovieGenres = function(movieId, genres, callback) {
	var query = {_id: movieId};
	movieCollectionToComplete.update(query, {'$set': {genres: genres}}, function(err, res) {
		if(err) {
			console.error("Error saving the genres for movie with id: " + movieId+"-- error: " + err);
			return callback(err, movieId);
		};
		console.log("Succes saving the genres for movie with id: " + movieId);
		return callback(null, movieId);
	});
};

/**
 *Save the akas for a given movie to movieCollectionToComplete collection
 *@param doc (movie)
 *@param lang 
 *@param description (description to save)
 */
var saveDescriptions = function(doc, lang, description) {
	var query = {_id: doc._id};
	var description = description.toString();
	movieCollectionToComplete.update(query, {'$addToSet': {descriptions:{content: description, lang: lang}} }, function(err, res) {
		if(err) {
			console.log("DB.js Error saving the akas for movie with id: "+doc._id+"-- error: " + err);
			return;
		};
		console.log("DB.js Succes saving description(s) for movie with id: "+doc._id);
		return;
	});
};

/**
 *Save the youtube trailerId for a given movie to movieCollectionToComplete collection
 *@param doc (movie)
 *@trailerId 
 */
var saveTrailer = function(doc, trailerId, callback) {
	var query = {_id: doc._id};
	movieCollectionToComplete.update(query, {'$set': {YoutubeTrailerId: trailerId}}, function(err, res) {
		if(err) {
			console.log("DB.js Error saving the trailerId for movie with id: " + doc._id + "-- error: " + err);
			return callback(err, doc);
		};
		console.log("DB.js Succes saving the trailerId for movie with id: " + doc._id);
		return callback(null, doc);
	});
};

/**
 * Store new subtitles in ToDownload Collection
 */
var seedNewSubTitles = function(doc, callback) {

   	subTitlesToDownload.insert(doc, function(err, result) {
		
			if(err) {		
				return callback(err, doc);
			}
			console.log("subtitle " + doc._id + " saved");
			return callback(null, doc);	
		});

	
};

/**
 * Store subtitles to the downloaded collection
 */
var saveSubTitleDownloaded = function(doc, callback) {

	subTitlesDownloaded.insert(doc, function(err, result) {
		if(err) {
			console.error("Error saving doc ID " + doc._id + ": " + err);
			doc.error = err;
			return callback(err, doc);
		}
		console.log("Document ID " + doc._id + " saved");
		return callback(null, doc);
	});

};


/**
 * Store subtitles ZIP to Downloaded collection
 */
var saveZipfile = function(fileId, zip, callback) {
	var query = {_id: fileId};
	subTitlesDownloaded.update(query, {'$set': {file: zip}}, function(err, res) {
		if(err) {
			console.log("DB.js Error saving the zip with id: "+fileId+"-- error: " + err);
			return callback(err, fileId);
		};
		console.log("DB.js Succes saving the zip with id: " + fileId);
		return callback(null, fileId);
	});
};

/**
 * Store image file to the movieCollection
 */
var saveImgfile = function(movieId, imgFile, callback) {
	var query = {_id: movieId};
	movieCollectionToComplete.update(query, {'$set': {img: imgFile}}, function(err, res) {
		if(err) {
			console.log("DB.js Error saving the img form movie: "+movieId+"-- error: " + err);
			return callback(err, movieId);
		};
		console.log("DB.js Succes saving the img with id: "+movieId);
		return callback(null, movieId);
	});
};


/**
* Get a subitile by the ID
**/
var findBySubID = function(id){
  subTitlesDownloaded.findOne({_id: id}, function (err, doc) {
			if(err) {
			console.error("Error retrieving sub with id: "+ doc._id +"--error: "+err)
			return callback(err, doc);
		};
			console.log("Sub with id: "+doc._id);
			return callback(null, doc);
			
  });
}

/**
* Get a movie from the to complete collection by the id
**/
var findMovietoCompleteByid = function(id, callback) {
  movieCollectionToComplete.findOne({_id: id}, function (err, doc) {
		if(err) {
			console.error("Error finding doc with id: " + id)
			return callback(err, doc);
    };
		console.log("Found movie to complete: " +  doc._id);
		return callback(null, doc);
			
  });
}

/**
* Get a movie from the to movie collection by the id
**/
var findMovieById = function(id, callback) {
  movieCollection.findOne({_id: id}, function (err, doc) {
		if(err) {
			console.error("Error finding doc with id: "+id)
			return callback(err, doc);
    };
		console.log("Found doc with id: "+ doc._id);
		return callback(null, doc);
			
  });
}
/**
* Get all documents from Download collection
* 
*/
var findAll = function(callback){
  subTitlesDownloaded.find({}, function (err, docs) {
		if(err) {
			console.error("Error finding all --error: "+err)
			return callback(err, doc);
    };
		console.log("Here is all: "+docs.length);
		return callback(doc);
			
  });
}

/**
*Generate the movieCollectionToComplete collection
*from an aggregation of the subtittlesDownloaded collection*
*/
var saveMovieCollection = function(callback){
  subTitlesDownloaded.aggregate( [
                      { $group : { _id : "$ImdbID",
                       movieName: {$first: "$MovieName"},
                       movieYear: {$first: "$MovieYear"},
                       movieKind: {$first: "$MovieKind"},
                       seriesSeason: {$first: "$SeriesSeason"},
                       seriesEpisode: {$first: "$SeriesEpisode"},
                       seriesIMDBParent: {$first: "$SeriesIMDBParent"}
                       } },
                      { $out : "movieCollectionTmp" }
                  ], function (err){
      if(err){
        console.error("Error generating movieCollectionToComplete collection: "+err);
        return callback(err);
      };
      console.log("movieCollectionToComplete aggregation success");
      findmovieCollectionTmp(function(err, docs){
      	if (err) console.error("Error with the findmovieCollectionToComplete: " + err);
      else 
     movieCollectionToComplete.insert(docs, function(err){
     	if (err){
     		console.error("Error with duplication to final movie collection: "+err);
     		return callback(err);
     	};
     	console.log("Duplication to final movie collection success");
     	movieCollectionTmp.drop(function(err, res){
		if(err){
			console.error("Error droping collection movieCollectionTm");
			return callback(err);
		};
		console.log("Collection movieCollectionTm succefully dropped");
		return callback(null)
	});
     	});
 });
     })
    };




// --|  Exports

module.exports = {
  /** iscrapDB and  mongo native driver */
  ObjectId:                              ObjectId,
  Mongoskin:                             iscrapDB.driver,
  iscrapDB:                              iscrapDB,


	subTitlesDownloaded:                   subTitlesDownloaded,

	subTitlesToDownload:                   subTitlesToDownload,

  findSubTitlesToDownload:               findSubTitlesToDownload,
  incrementSubTitlesToDowloadErrorCount: incrementSubTitlesToDowloadErrorCount,
  removeSubTitlesToDownload:             removeSubTitlesToDownload,

	saveSubTitleDownloaded:                saveSubTitleDownloaded,
	seedNewSubTitles:  				   	   seedNewSubTitles,
	saveZipfile:                           saveZipfile,
	findBySubID: 						   findBySubID,
	findAll: 							   findAll,
  saveMovieCollection:                  saveMovieCollection,
  findMoviesToPopulate: 				findMoviesToPopulate,
  saveMovieAkas: 						saveMovieAkas,
  saveDescriptions: 					saveDescriptions,
  saveImgfile: 							saveImgfile,
  findMovieById: 						findMovieById,
  dropSubtitleDownloaded: 				dropSubtitleDownloaded,
  findNewSubtitlesByLang: 				findNewSubtitlesByLang,
  removeMovieToComplete:                removeMovieToComplete,
  saveToMovieCollection: 				saveToMovieCollection,
  findMovietoCompleteByid: 				findMovietoCompleteByid,
  removeNewSubtitlesByLang: 			removeNewSubtitlesByLang,
  saveTrailer: 							saveTrailer,
  findwebsiteToPublishTo: findwebsiteToPublishTo,
  saveToSubtitlesCollection: saveToSubtitlesCollection,
  findSubTitlesDownloaded: findSubTitlesDownloaded,
  findmovieCollectionTmp: findmovieCollectionTmp,
  findSubTitlesByImDBid: findSubTitlesByImDBid,
  saveTonewSubtitlesToPublish: saveTonewSubtitlesToPublish,
  saveInstanceInfo: saveInstanceInfo,
  cleanInstanceBackList: cleanInstanceBackList,
  findAwsInstance: findAwsInstance,
  findAwsInstanceByIp: findAwsInstanceByIp,
  saveMovieGenres: saveMovieGenres,
  saveMovieActor: saveMovieActor,
  saveMovieDirector: saveMovieDirector,
  removeMovieInMovieCollectionById: removeMovieInMovieCollectionById,
  findSubTitlesToDownloadToHandleManualy: findSubTitlesToDownloadToHandleManualy,
  saveSubtitlesWithError: saveSubtitlesWithError,
  findFrenchMovieSubTitlesToDownload: findFrenchMovieSubTitlesToDownload

};
