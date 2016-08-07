/** @module Wordpress poster Module*/
var WP = require( 'wordpress-rest-api' )
  , db     = require('../lib/db.js')
  , handlebars = require('handlebars')
  , fs = require('fs')

var wp = new WP({
    endpoint: 'url/wp-json',
    username: 'user',
    password: 'pass'
});

    /**
 * Post all subtitles that are to publish for a given lang
 * @method PostSubtitlesToWordpressByLang
 * @param langList (the list of lang that are to publish for)
 * @param langIndex  
 * @param {} callback
 * @return 
 */
function PostSubtitlesToWordpressByLang(langList, langIndex, callback){
    var lang = langList[langIndex]._id;

    /**
     * Get next lang in the list
     * @method nextLang
     * @return 
     */
    function nextLang() {
        console.log("---------------------------------");
        if (langIndex === langList.length-1) callback(null);
        else PostSubtitlesToWordpressByLang(langList, langIndex + 1, callback);
    }

db.findNewSubtitlesByLang(lang, function(err, subs) {


        if (err) return callback(err);
   

        PostOnWordpress(lang, subs, 0, callback);


    });

/**
 * Post to wordpress for
 * @method PostOnWordpress
 * @param lang (given lang)
 * @param subs (list of subtitles for the lang)
 * @param index (index for the subs list)
 * @param {} callback
 * @return 
 */
function PostOnWordpress(lang, subs, index, callback) {
    if (subs.length == 0) {
        console.log("Nothing to post to wordpress for lang " + lang);
        return nextLang();
    }

    /*
    *Get all the subtitles for a given movie (all language filtering is on template)
    */
    var movieId = subs[index].ImdbID;
    db.findSubTitlesByImDBid(movieId, function(err, subsForMovie){
        if (err){
            console.error("Error finding subs for movie with id: " + movieId);
        }
        GetMovie(lang, subsForMovie, callback);

    });

/**
 * Get get the movie infos
 * @method GetMovie
 * @param {} lang
 * @param {} subsForMovie
 * @param {} callback
 * @return 
 */
function GetMovie(lang, subsForMovie, callback){
    db.findMovieById(movieId, function(err, movie) {
 if (err) {
    console.error("Error finding Movie "+err);
  }
  else if (!movie){
            console.log("Movie "+ index +" is null (WP poster)");
            return next();
        }
    else {
console.log("Wordpress poster Processing movie " + index + " with ID: " + movie._id);
getDescriptionByLang(lang, movie, subsForMovie);
};
});
};


    /**
     * Get next subtitles in the list
     * @method next
     * @return 
     */
    function next() {
        console.log("---------------------------------");
        if (index === subs.length-1) {
            db.saveToSubtitlesCollection(lang, function(err, data){
                if (err) {
                    console.error("Error saving sub to subcollection: " + err);
                }
            
            db.removeNewSubtitlesByLang(lang, nextLang);
        });
        }
        else PostOnWordpress(lang, subs, index + 1, callback);
    }

    /**
     * callback one the wordpress posting is done
     * @method onPostedOnWordpress
     * @param {} error
     * @return 
     */
    function onPostedOnWordpress(error){
        if (error){
            console.log("Could not find movie with id: " + movie._id);
        } else {
            console.log("Movie succefuly posted on wordpress");
            return next();
            

        }
    }



/**
 * Get description for a give lang and movie
 * @method getDescriptionByLang
 * @param lang
 * @param movie
 * @param {} subsForMovie
 * @return 
 */
function getDescriptionByLang(lang, movie, subsForMovie){

console.log(lang);
for (var i in movie.descriptions) {
    if (movie.descriptions[i].lang == lang){
      var description = movie.descriptions[i].content;
      if (description.length == 0)description = "No description found";

         generateTemplate(movie, subsForMovie, lang, description);
        
     
    };
    
}   
}

/**
 * Populate and compile handlebar template
 * @method generateTemplate
 * @param movie
 * @param subsForMovie
 * @param lang
 * @param description
 * @return 
 */
function generateTemplate(movie, subsForMovie, lang, description){

    var now = new Date();
    var jsonDate = now.toJSON();
    var data = {
  lang: lang,
  description: description,
  imdbID: movie._id,
  MovieName: movie.movieName,
  akas: movie.akas,
  currentdate: jsonDate,
  subtitles: subsForMovie,
  trailer: movie.YoutubeTrailerId,
  actors: movie.actors,
  genres: movie.genres,
  director: movie.director
    }
data.body = process.argv[2];

fs.readFile('./templateFR.html', 'utf-8', function(error, source){
  handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});
  var template = handlebars.compile(source);
  var html = template(data);
  checkPostExistence(html, movie);
});

};

/**
 * Check post existence and create or upadted post
 * TODO Category
 * @method checkPostExistence
 * @param html (generated template)
 * @param movie
 * @return 
 */
function checkPostExistence(html, movie){
wp.posts()
    .search( "imdb.com/title/tt" + movie._id ) //should be unique!
    .then(function(res) {
        
        console.log("Got "+ res.length +" result for post with imdb id: " + movie._id);
        if (res.length == 0) createNewPost(html, movie);
        if (res.length == 1) updateExistingPost(res[0].id, html, movie);
        if (res.length > 1) {
    console.warn("Problem matching unique post with imdb id: " + movie._id);
    onPostedOnWordpress();
        }
    });
}

/**
 * Description
 * @method updateExistingPost
 * @param {} idPost
 * @param {} html
 * @param {} movie
 * @return 
 */
function updateExistingPost(idPost, html, movie){
    var postTitle = movie.movieName;
    if (movie.movieKind == "tv"){
        postTitle += " S" + movie.seriesSeason + "E" + movie.seriesEpisode;
    }
wp.posts().id(idPost).update({
     title: postTitle,
     content : html,
     status: 'publish'
    

})
.then(function(response) {
    console.log("Sucess updating post: "+response.id );
    onPostedOnWordpress();
});
}

/**
 * Description
 * @method createNewPost
 * @param {} html
 * @param {} movie
 * @return 
 */
function createNewPost(html, movie){
    var postTitle = movie.movieName;
    if (movie.movieKind == "tv"){
        postTitle += " S0"+ movie.seriesSeason + "E" + movie.seriesEpisode;
    }
wp.posts().create({
    title: postTitle,
    content: html,
    status: 'publish'
    

})
.then(function(response) {
    console.log("Sucess creating post: "+response.id );
    onPostedOnWordpress();
});
};
};
}


// --| export
module.exports = {
  /**
   * Description
   * @method Post
   * @param {} callback
   * @return 
   */
  Post: function(callback) {
    db.findwebsiteToPublishTo(function(err, langList){
        if (err) callback(err);
        if (langList.lenght == 0) {
          console.log("No webiste to publish found");
          callback(null);
        }
        else PostSubtitlesToWordpressByLang(langList, 0, callback);
    });
  }
}
