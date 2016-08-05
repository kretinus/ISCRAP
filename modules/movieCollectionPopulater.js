/** @module Scrapping Module*/
var config = require('../config.js'),
    db = require('../lib/db.js'),
    Xray = require('x-ray'),
    x = Xray(),
    fs = require("fs"),
    path = require('path'),
    http = require('http'),
    request = require('request'),
    wordpress = require('wordpress');
    
var WPclient = wordpress.createClient({
    url: 'wordrpessurl',
    username: 'wp_admin_user',
    password: 'wp_admin_password'
});

/**
 * Download subtitle
 * Recursive function
 * @param list (a list of subtitle to download)
 * @param index (index of subtitle in the list)
 * @param callback to call once all subtitles has been Downloaded
 */

function populateMovieCollection(list, index, callback) {
    var doc = list[index];

    /**
     * Get next subtitles in the list
     */
    function next() {
        console.log("---------------------------------");
        if (index === list.length - 1) callback(null);
        else populateMovieCollection(list, index + 1, callback);
    }

    /**
     * Callback on scrapping finished
     */
    function onMoviePopulated(error) {
        var id = doc._id;
        if (error) {
            console.log("Could not find movie with id: " + doc._id);
        } else {
            console.log("Movie " + doc._id + " succefuly populated");
            fs.exists("./img/" + doc._id + ".jpg", function(exists) {
                if (exists) {
                    console.log('Deleting image file ' + doc._id + 'from the disk');
                    fs.unlink("./img/" + doc._id + ".jpg");
                } else {
                    console.log('File ' + doc._id + ' not found on the disk');
                }
            });
            db.findMovietoCompleteByid(id, function(err, doc) {
                if (err) {
                    console.error("Error getting movie " + id + " to save to movie collection")
                };

                db.removeMovieInMovieCollectionById(doc, function(err) {
                    if (err) {
                        console.error("Error removing the movie from movie collection (manul upsert) " + err)
                    }


                    db.saveToMovieCollection(doc, function(err) {
                        if (err) {
                            console.error("Error while saving subtitle ID " + doc._id + " to movie collection, error: " + err);
                            doc.error = err;
                            return next();
                        } else
                            return db.removeMovieToComplete(doc, next);

                    });
                })
            });

        }
    }

    console.log("Processing populater for movie with ID: " + doc._id);

    /**
     * Recursive function to  get description from opensub with corresponding language
     * TODO if (description.length !== 0) scrap IMDB description
     * @param i (index)
     */
    descriptionScrapper(0)

    function descriptionScrapper(i) {
        db.findSubTitlesByImDBid(doc._id, (function(err, docs) {
            if (err) console.log(err);


            if (i == docs.length) akaScrapper();

            if (i < docs.length) {
                var lang = docs[i].ISO639;
                var id = docs[i]._id;
                x('http://www.opensubtitles.org/' + lang + '/subtitles/' + id, 'fieldset', ['span[itemprop="description"]'])
                    (function(err, description) {
                        if (err) {
                            console.error("Error scrapping descriptions for movie: " + doc._id + " --error: " + err);
                            descriptionScrapper(i + 1)
                        }

                        console.log("Description for lang: " + lang + " : " + description);


                        db.saveDescriptions(doc, lang, description);

                        descriptionScrapper(i + 1)

                    })
            }
        }))
    }


    /**
     * Scrap AKA (AlsoKnownAs) from IMDB
     */
    function akaScrapper() {
        x('http://www.imdb.com/title/tt0' + doc._id + '/releaseinfo', '.spEven2Col', ['td:nth-child(2)'])
            (function(err, akas) {
                if (err) {
                    console.error("Error scrapping akas for movie: " + doc._id + "--error: " + err);
                    directorScrapper();
                } else {
                    if (akas.length == 0) {
                        console.log("No akas found");
                        directorScrapper();

                    } else {

                        console.log("Akas: " + akas);
                        db.saveMovieAkas(doc._id, akas, directorScrapper);
                    }
                }
            });
    }

    /**
     * Scrap the film Director (only the first if many) from IMDB
     */
    function directorScrapper() {
        x('http://www.imdb.com/title/tt0' + doc._id, '.plot_summary', [{
                Director: '.itemprop, span[itemprop="name"]'
            }])
            (function(err, res) {
                if (err) {
                    console.error("Error scrapping director: " + err);
                    actorsScrapper();
                } else {
                    if (res.length == 0) {
                        console.log("No director found");
                        actorsScrapper();

                    } else {
                        var director = res[0].Director;

                        console.log("Director: " + director);

                        db.saveMovieDirector(doc._id, director, actorsScrapper);
                    }
                }
            });
    }

    /**
     * Scrap the main actors from IMDB
     */
    function actorsScrapper() {
        x('http://www.imdb.com/title/tt0' + doc._id, '.credit_summary_item', ['.itemprop, span[itemprop="actors"]'])
            (function(err, res) {
                if (err) {
                    console.error("Error scrapping actors: " + err);
                    genreScrapper();
                } else {
                    if (res.length == 0) {
                        console.log("no actors found");
                        genreScrapper();


                    } else {
                        var actors = [];

                        for (var i = 0; i < res.length; i++) {
                            if (res[i].match(/\n/g)) {

                                var start_pos = res[i].indexOf('\n') + 1;
                                var end_pos = res[i].indexOf(',', start_pos);
                                var actor = res[i].substring(start_pos, end_pos);
                                if (!(!actor || /^\s*$/.test(actor))) {
                                    console.log("Actor: " + actor);
                                    actors.push(actor);

                                }

                            }
                            if (i == res.length - 1) db.saveMovieActor(doc._id, actors, genreScrapper);
                        };
                    }
                }
            });
    }

    /**
     * Scrap the movie genres from IMDB
     */
    function genreScrapper() {
        x('http://www.imdb.com/title/tt0' + doc._id, '.title_wrapper', ['span[itemprop="genre"]'])
            (function(err, res) {
                if (err) {
                    console.error("Error scrapping " + err);
                    getYoutubeTrailer();
                } else {
                    if (res.length == 0) {
                        console.log("no genre found");
                        getYoutubeTrailer();

                    } else {

                        console.log("Genre " + res);
                        db.saveMovieGenres(doc._id, res, getYoutubeTrailer);
                    }
                }
            });
    }

    /**
     *Retrieve a youtube video ID for search term "trailer + moviename + movieyear"
     *using youtube v3api
     */
    function getYoutubeTrailer() {
        var url = config.populate.youtubeUrl + doc.movieName + "+" + doc.movieYear + "&key=" + config.populate.youtubeAPIkey;
        request({
            url: url,
            json: true
        }, function(err, response, res) {
            if (!err && response.statusCode === 200) {
                if (!res.items.length == 0) {
                    console.log("Found trailer for movie " + doc._id + " at www.youtube.com/watch?v=" + res.items[0].id.videoId);
                    db.saveTrailer(doc, res.items[0].id.videoId, imageScrapper);
                } else {
                    console.log("No trailer found on youtube for " + doc.movieName + " " + doc.movieYear + " nothing to save");
                    imageScrapper();
                }
            } else {
                console.log("Issue with youtube API  nothing to save" + err);
                imageScrapper();
            }

        })
    }

    /**
     * Scrap video trailer from imdb
     * if notice -> no trailer
     * not in use since youtube is more accurate
     */
    function ImdbtrailerScrapper() {
        x('http://www.imdb.com/title/tt0' + doc._id + '/videogallery', '#video_gallery_content', {
            notice: '.ilm_notice',
            link: '.search-results li:first-child a@href'
        })

        (function(err, res) {
            if (err) console.error("Error getting movie trailer link: " + err);
            if (res.notice === undefined) {
                var trailer = res.link.match(/\d+/g);
                var trailerId = "vi" + trailer[0];
                console.log("Found trailer for movie :" + doc._id + " with id: " + trailerId);
                db.saveTrailer(doc, trailerId, imageScrapper);
            } else {
                console.log("No trailer found for movie with id: ");
                imageScrapper();
            }

        });
    }

    /**
     * Scrap the movie image from IMDB with maxwith 1000px to avoid huge film
     * Then "post" the image to wordpress media.
     */
    function imageScrapper() {
        x('http://www.imdb.com/title/tt0' + doc._id, '.poster', {
            imgUrl: '[src]@src',
        })

        (function(err, results) {
            if (err) {
                console.error("Error getting movie image link: " + err);
                onMoviePopulated();
            } else {
                if (!results || 0 === results.length) {
                    console.log("No link found");
                    onMoviePopulated();
                } else {
                    var url = results.imgUrl;
                    url = url.substring(0, url.indexOf('_V1_'));
                    url += "SY1000_.jpg";
                    console.log(url);
                    var dest = "./img/" + doc._id + ".jpg";

                    var imgFile = fs.createWriteStream(dest);
                    var request = http.get(url, function(response) {
                        response.pipe(imgFile);
                        imgFile.on('finish', function() {
                            var imgToUpload = fs.readFileSync('./img/' + doc._id + '.jpg');
                            imgUpload(doc, imgToUpload);

                            function imgUpload(doc, imgToUpload) {
                                WPclient.uploadFile({
                                    name: doc._id + ".jpg",
                                    type: "image/jpg",
                                    bits: imgToUpload
                                }, function(err, data) {
                                    if (err) {
                                        console.error("Error with file upload: " + err);
                                        db.saveImgfile(doc._id, imgToUpload, onMoviePopulated);
                                    } else {
                                        console.log("imgUpload to wordpress OK");
                                        db.saveImgfile(doc._id, imgToUpload, onMoviePopulated);
                                    }
                                });
                            };


                        });
                    });
                }
            }
        });
    }

}

// --| export
module.exports = {
    Populate: function(batchSize, callback) {
        db.findMoviesToPopulate(batchSize, function(err, list) {
            if (err) return callback(err);

            populateMovieCollection(list, 0, function(err) {
                if (err) callback(err);
                else callback(null, list);
            });
        });
    }
}