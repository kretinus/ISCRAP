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

## Tech specs

This projet has been deployed on a ubuntu 16.04 virtual server that should be fully compatible now
<br>Database : MongoDB 3.2 
PHP: 7.x

## installation

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
## credential
youtube API key (google dev) for youtube trailer matching
Wordpress user/password
JSON Basic Authentication needed

## Wordpress installation
Regular update Wordpress is sufficent but following plugin are required
<br>WP REST API
<br>JSON Basic Authentication
<br>MCE Table Buttons (just for design)
## usage
Default usage counts the number of main app loop
```javascript
if (count == 1) finished();
```

## ToDo

templateFr.html -> handle if no image
<br>awsManager -> ? if blacklist
<br>zipZupload -> Handle error if no files 
<br>dbSeeder:csv2json -> Random? conversion error
<br>dbSeeder -> Huge file handeling is not done here
<br>lib/database -> Update and clean lib, implement $upsert, handle collection "subtitlesToHandleManualy"
