# iScrap 

Subtitle scraper and publisher - Academic projet - HEIG-VD 2016",

Out of the box it supports the following features:

* Amazon ec2 instance creation and handling with 24h ip blacklist 
* Download subtitle over SSH and increment error count if redirection
* MovieCollection aggregator
* IMDb and opensubtitles.org scrapper, gets youtube video id for video trailer
* Databse seed from opensubtitles.org list
* Create and Update methode for Wordpress posts
* Handlebar template for Wordpress posts
* Publish subtitles according to a website scope stored in databse
* Image and zip file storage in databse
* Wordpress posts retrieve subtitle from database
* Comprehensive logs
* Error handeling

## Demo

Check out the Wordpress demo! more than 10'000 movies posted
http://149.202.172.22
## Tech specs

This projet has been deployed on a ubuntu 16.04 virtual server that should be fully compatible now
<br>Database : MongoDB 3.2 
PHP: 7.x

## Installation

projectdir$ npm install app.js

## Monkii override
Small override is need to avoid casting issue if custom id used.
Replace, line 53 in lib/collection
```javascript
function (str) {
  if (null == str) return this.col.id();
 return 'string' == typeof str ? this.col.id(str) : str;
};
```
With this
```javascript
function (str) { return str; };
```
## Credential
youtube API key (google dev) for youtube trailer matching
Wordpress user/password
JSON Basic Authentication needed

## Wordpress installation
Regular update Wordpress is sufficent but following plugin are required
<br>WP REST API
<br>JSON Basic Authentication
<br>MCE Table Buttons (just for design)
<br>Also to download subtitles from Mongo in PHP7 beware of native driver change old -> new
    ```php
    \MongoClient -> \MongoDB\Client
    \MongoCollection -> \MongoDB\Collection
    ```
## Usage
Default usage counts the number of main app loop
```javascript
if (count == 1) finished();
```

## Full log sample
An example for one subtitles beeing proccessed
[2016-08-02 08:46:25.564] [INFO] console - Sucess removing instance from black list 
[2016-08-02 08:46:26.327] [INFO] console - New instance created with id:	i-0d8576ec59f2d5d40

[2016-08-02 08:46:39.364] [INFO] console - 	i-0d8576ec59f2d5d40	54.175.39.66	pending
[2016-08-02 08:46:39.375] [INFO] console - 54.175.39.66 is not blacklisted
[2016-08-02 08:46:39.386] [INFO] console - instanceInfo succesfully saved for id: i-0d8576ec59f2d5d40
[2016-08-02 08:46:39.387] [INFO] console - Processing with 54.175.39.66
[2016-08-02 08:50:31.277] [INFO] console - --- Instance number: 0 ---
[2016-08-02 08:50:32.067] [INFO] console - - ready
[2016-08-02 08:50:32.133] [INFO] console - processing document 0 with id 59
[2016-08-02 08:50:33.011] [INFO] console - Stream :: close :: code: 0
[2016-08-02 08:50:33.012] [INFO] console - Download OK
[2016-08-02 08:50:33.032] [INFO] console - Document ID 59 saved
[2016-08-02 08:50:33.034] [INFO] console - Document ID 59 removed from subTitlesToDownload
[2016-08-02 08:50:50.061] [INFO] console - ---------------------------------
[2016-08-02 08:50:50.606] [INFO] console - Done transferring ddl_batch
[2016-08-02 08:50:51.593] [INFO] console - TERM:	i-0d8576ec59f2d5d40
[2016-08-02 08:50:51.593] [INFO] console - All instance succesfuly terminated
[2016-08-02 08:50:51.597] [INFO] console - 0 processing file arpointeu.(2004).fre.1cd.(382).zip with id 382
[2016-08-02 08:50:51.602] [INFO] console - DB.js Succes saving the zip with id: 382
[2016-08-02 08:50:51.602] [INFO] console - Zip succefuly saved to DB
[2016-08-02 08:50:51.603] [INFO] console - Deleting file arpointeu.(2004).fre.1cd.(382).zipfrom the disk
[2016-08-02 08:50:51.693] [INFO] console - ---------------------------------
[2016-08-02 08:50:51.717] [INFO] console - movieCollectionToComplete aggregation success
[2016-08-02 08:50:51.725] [INFO] console - Duplication to final movie collection success
[2016-08-02 08:50:51.730] [INFO] console - Collection movieCollectionTm succefully dropped
[2016-08-02 08:50:51.753] [INFO] console - saveTonewSubtitlesToPublish success
[2016-08-02 08:50:51.759] [INFO] console - Processing populater for movie with ID: 60827
[2016-08-02 08:50:51.760] [INFO] console - Found: 1 subtitles for Imdbid: 60827
[2016-08-02 08:50:52.550] [INFO] console - Description for lang: fr : Elizabeth Vogler, célèbre actrice au théâtre, s'interrompt brusquement au milieu d'une tirade de la pièce Électre. Elle ne parlera plus. D'abord soignée dans une clinique, son médecin l'envoie se reposer au bord de la mer en compagnie d'Alma, une jeune infirmière. Les deux femmes se lient d’amitié. Le silence permanent d'Elizabeth conduit Alma à parler et à se confier. La découverte d’une lettre dans laquelle Elizabeth divulgue cette confession à son médecin provoque alors une crise relationnelle profonde.
[2016-08-02 08:50:52.554] [INFO] console - DB.js Succes saving description(s) for movie with id: 60827
[2016-08-02 08:50:52.555] [INFO] console - Found: 1 subtitles for Imdbid: 60827
[2016-08-02 08:50:53.294] [INFO] console - Akas: Persona,Персона,Quando Duas Mulheres Pecam,Persona,Persona - sonate for to,Persona,Naisen naamio - Persona,Erotes horis fragmo,Έρωτες χωρίς φραγμό,Persona,Persona,Persona,A Máscara,Persona,Персона,Kinematografi,Персона,Persona
[2016-08-02 08:50:53.297] [INFO] console - Succes saving the akas for movie with id: 60827
[2016-08-02 08:50:54.422] [INFO] console - Director: Ingmar Bergman
[2016-08-02 08:50:54.424] [INFO] console - Succes saving the director for movie with id: 60827
[2016-08-02 08:50:55.397] [INFO] console - Actor: Bibi Andersson
[2016-08-02 08:50:55.398] [INFO] console - Actor: Liv Ullmann
[2016-08-02 08:50:55.399] [INFO] console - Succes saving the actor for movie with id: 60827
[2016-08-02 08:50:56.376] [INFO] console - Genre Drama,Thriller
[2016-08-02 08:50:56.377] [INFO] console - Succes saving the genres for movie with id: 60827
[2016-08-02 08:50:56.694] [INFO] console - Found trailer for movie 60827 at www.youtube.com/watch?v=amxvetvKfho
[2016-08-02 08:50:56.696] [INFO] console - DB.js Succes saving the trailerId for movie with id: 60827
[2016-08-02 08:50:57.836] [INFO] console - http://ia.media-imdb.com/images/M/MV5BMTc1OTgxNjYyNF5BMl5BanBnXkFtZTcwNjM2MjM2NQ@@.SY1000_.jpg
[2016-08-02 08:50:58.310] [INFO] console - imgUpload to wordpress OK
[2016-08-02 08:50:58.313] [INFO] console - DB.js Succes saving the img with id: 60827
[2016-08-02 08:50:58.313] [INFO] console - Movie 60827 succefuly populated
[2016-08-02 08:50:58.315] [INFO] console - Deleting image file 60827from the disk
[2016-08-02 08:50:58.317] [INFO] console - Found doc with id: 60827
[2016-08-02 08:50:58.318] [INFO] console - Document ID 60827 removed from movieCollection
[2016-08-02 08:50:58.320] [INFO] console - Document ID 60827 saved
[2016-08-02 08:50:58.321] [INFO] console - Document ID 60827 removed from movieCollectionToComplete
[2016-08-02 08:50:58.322] [INFO] console - ---------------------------------
[2016-08-02 08:53:23.918] [INFO] console - Collection subtitleDownloaded succefully dropped
[2016-08-02 08:53:23.927] [INFO] console - Found: 30 subtitles for lang: fr
[2016-08-02 08:53:26.126] [INFO] console - Found: 1 subtitles for Imdbid: 60827
[2016-08-02 08:53:26.128] [INFO] console - Wordpress poster Processing movie 6 with ID: 60827
[2016-08-02 08:53:26.128] [INFO] console - fr
[2016-08-02 08:53:26.157] [INFO] console - Got 0 result for post with imdb id: 60827
[2016-08-02 08:53:26.273] [INFO] console - Sucess creating post: 4207
[2016-08-02 08:53:26.274] [INFO] console - Movie succefuly posted on wordpress
[2016-08-02 08:53:26.274] [INFO] console - ---------------------------------
[2016-08-02 08:53:30.119] [INFO] console - saveTo subTitlesCollection success

## ToDo

templateFr.html -> handle if no image
<br>awsManager -> ? if blacklist
<br>zipZupload -> Handle error if no files 
<br>dbSeeder:csv2json -> Random? conversion error
<br>dbSeeder -> Huge file handeling is not done here
<br>lib/database -> Update and clean lib, implement $upsert, handle collection "subtitlesToHandleManualy"
