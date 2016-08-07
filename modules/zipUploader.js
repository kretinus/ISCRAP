/** @module Zip Uploader Module*/
var db = require('../lib/db.js'),
    config = require('../config.js'),
    fs = require('fs'),
    Finder = require('fs-finder'),
    path = require('path');


var downloadFolder = config.batch.downloadFolder;


/**
 * Description
 * @method process
 * @param {} callback
 * @return 
 */
function process(callback) {
    var filesFullNameList = Finder.from('./' + downloadFolder).findFiles();
    uploadSubtitles(0, callback);

    /**
     * Upload subtitles ZIP file
     * Recursive function
     * @method uploadSubtitles
     * @param index (index to parse the subtitles list)
     * @param callback to call once all subtitles have been uploaded
     * @return 
     */
    function uploadSubtitles(index, callback) {

        var fileName = path.basename(filesFullNameList[index]);

        var fileId = fileName.match(/\([0-9]{0,}\w\).zip/);
        fileId = String(fileId);
        fileId = fileId.match(/\d/g);
        fileId = fileId.join("");
        fileId = Number(fileId);

        if (fileName !== null) var zipFile = fs.readFileSync('./' + downloadFolder + '/' + fileName);
        else next();


        /**
         * Process next ZIP
         * @method next
         * @return 
         */
        function next() {
            console.log("---------------------------------");
            if (index === filesFullNameList.length - 1) callback(null);

            else uploadSubtitles(index + 1, callback);
        }

        /**
         * Callback on upload finished
         * delets the file on disk if succefully stored in DB
         * @method onZipUploaded
         * @param {} error
         * @return 
         */
        function onZipUploaded(error) {
            if (error) {
                console.log("Could not find sub with id: " + fileId);
            } else {
                console.log("Zip succefuly saved to DB");
                fs.exists('./' + downloadFolder + '/' + fileName, function(exists) {
                    if (exists) {
                        console.log('Deleting file ' + fileName + 'from the disk');
                        fs.unlink('./' + downloadFolder + '/' + fileName);
                        return next();
                    } else {
                        console.log('File ' + fileName + ' not found on the disk');
                        return next();
                    }
                });

            }
        }
        if (!filesFullNameList) {
            callback("File " + index + " is null");
            return;
        }
        console.log(index + " processing file " + fileName + " with id " + fileId);
        db.saveZipfile(fileId, zipFile, onZipUploaded);


    }
}
// --| export
/**
 * ZipUpload module
 * @module ZipUpload
 */

module.exports = {
    /**
     * Upload zip to subtitle in mongo
     * @method ZipUpload
     * @param {} callback
     * @return 
     */
    ZipUpload: function(callback) {

        process(function(err) {
            if (err) callback(err);
            else callback(null);
        });

    }
}
