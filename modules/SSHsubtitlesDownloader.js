/** @module SSH Subtitle Downloader module */
var config = require('../config.js'),
    db = require('../lib/db.js'),
    exec = require('child_process').exec,
    Client = require('ssh2').Client,
    fs = require('fs'),
    tar = require('tar-fs'),
    zlib = require('zlib'),
    srcUrl = config.opensubtitles.srcUrl,
    batchSize = config.batch.size,
    dllfolder = config.batch.downloadFolder,
    util = require('util');


/**
*Download subtitles from an AWS instance via SSH and download them back to local storage
*@param AWSInstanceIP 
*/
function download(AWSInstanceIP, callback) {
    var conn = new Client();

    conn.on(
        'ready',
        function() {
            console.log("- ready");
            db.findFrenchMovieSubTitlesToDownload(batchSize, function(err, list) {
                if (err) console.log(err);

                getSubTitles(list, 0, function(err) {
                    if (err) console.log(err);
                    else return null;
                });
            });

        }
    );
    conn.on(
        'end',
        function() {
            callback(null);
        }
    );
    conn.on(
        'error',
        function(err) {
            console.error("- connection error: %s", JSON.stringify(err));
            callback(err);
        }

    ).connect({
        host: AWSInstanceIP,
        port: 22,
        username: 'ec2-user', //AWS Linux Default user
        privateKey: require('fs').readFileSync('./.aws/AWS_PairKey.ppk') 
    });

    /**
    *Compress and transfert remote subtitle folder to local path
    */

    function transferDir(conn, remotePath, localPath, compression, cb) {
        var cmd = 'tar cf - "' + remotePath + '" 2>/dev/null';

        if (typeof compression === 'function')
            cb = compression;
        else if (compression === true)
            compression = 6;

        if (typeof compression === 'number' && compression >= 1 && compression <= 9)
            cmd += ' | gzip -' + compression + 'c 2>/dev/null';
        else
            compression = undefined;

        conn.exec(cmd, function(err, stream) {
            if (err)
                return cb(err);

            var exitErr;

            var tarStream = tar.extract(localPath);
            tarStream.on('finish', function() {
                cb(exitErr);
            });

            stream
                .on('exit', function(code, signal) {
                    if (typeof code === 'number' && code !== 0)
                        exitErr = new Error('Remote process exited with code ' + code);
                    else if (signal)
                        exitErr = new Error('Remote process killed with signal ' + signal);
                }).stderr.resume();

            if (compression)
                stream = stream.pipe(zlib.createGunzip());

            stream.pipe(tarStream);
        });
    }

    /**
     * Download subtitle
     * Recursive function
     * @param list (a list of subtitle to download)
     * @param index (index of subtitle in the list)
     * @param callback to call once all subtitles has been Downloaded
     */
    function getSubTitles(list, index, callback) {
        var doc = list[index];

        /**
         * Get next subtitles in the list
         */
        function next() {
            console.log("---------------------------------");
            if (index === list.length - 1)
            //function transferDir(conn, remotePath, localPath, compression, cb) 
                transferDir(conn,
                dllfolder,
                './',
                true, // uses compression with default level of 6
                function(err) {
                    if (err) throw err;
                    console.log('Done transferring ' + dllfolder);
                    conn.end();
                });

            else getSubTitles(list, index + 1, callback);
        }

        /**
         * Callback on wget finished
         */
        function onSubTitleDownloaded(error, stream) {
            var error = null;
            var stdout = null;
            stream.on('close', function(code, signal) {
                console.log('Stream :: close :: code: ' + code);
                // if error code means redirection or problem with file download
                if (code > 0) {
                    doc.error = error;
                    console.log('exec error: ' + error);
                    db.incrementSubTitlesToDowloadErrorCount(doc, function(err) {
                        if (err)
                            console.log("Error while incrementing error count for subtitle ID " + doc._id);
                        return next();
                    });
                } else {
                    console.log("Download OK");
                    db.saveSubTitleDownloaded(doc, function(err) {
                        if (err) {
                            console.log("Error while saving subtitle ID " + doc._id + " to Downloaded collection");
                            doc.error = err;
                            return next();
                        } else
                            return db.removeSubTitlesToDownload(doc, next);
                    });

                }

            }).on('data', function(data) {
                //console.log('STDOUT: ' + data);
                stdout = stdout + data;
            }).stderr.on('data', function(data) {
                //console.log('STDERR: ' + data);
                error = error + data;
            });
        }

        if (!doc) {
            callback("Document " + index + " is null");
            return;
        }
        console.log("processing document " + index + " with id " + doc._id);

        var downloadLink = srcUrl + doc._id;
        var cmd = 'wget ' + downloadLink + ' ' + config.batch.wgetOptions + ' ' + config.batch.downloadFolder;
        conn.exec(cmd, onSubTitleDownloaded);
    }
}

// --| export
module.exports = {
    Download: download
}