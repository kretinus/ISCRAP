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
Database : MongoDB 3.2 
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

## usage
Default usage counts the number of main app loop


```bash
[2010-01-17 11:43:37.987] [DEBUG] [default] - Some debug messages
```
See example.js for a full example, but here's a snippet (also in fromreadme.js):
```javascript

```
Output:
```bash
[2010-01-17 11:43:37.987] [ERROR] cheese - Cheese is too ripe!
[2010-01-17 11:43:37.990] [FATAL] cheese - Cheese was breeding ground for listeria.
```    
The first 5 lines of the code above could also be written as:
```javascript
var log4js = require('log4js');
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/cheese.log', category: 'cheese' }
  ]
});
```

## configuration

You can configure the appenders and log levels manually (as above), or provide a
configuration file (`log4js.configure('path/to/file.json')`), or a configuration object. The 
configuration file location may also be specified via the environment variable 
LOG4JS_CONFIG (`export LOG4JS_CONFIG=path/to/file.json`). 
An example file can be found in `test/log4js.json`. An example config file with log rolling is in `test/with-log-rolling.json`.
You can configure log4js to check for configuration file changes at regular intervals, and if changed, reload. This allows changes to logging levels to occur without restarting the application.

To turn it on and specify a period:

```javascript
log4js.configure('file.json', { reloadSecs: 300 });
```
For FileAppender you can also pass the path to the log directory as an option where all your log files would be stored.

```javascript
log4js.configure('my_log4js_configuration.json', { cwd: '/absolute/path/to/log/dir' });
```
If you have already defined an absolute path for one of the FileAppenders in the configuration file, you could add a "absolute": true to the particular FileAppender to override the cwd option passed. Here is an example configuration file:

#### my_log4js_configuration.json ####
```json
{
  "appenders": [
    {
      "type": "file",
      "filename": "relative/path/to/log_file.log",
      "maxLogSize": 20480,
      "backups": 3,
      "category": "relative-logger"
    },
    {
      "type": "file",
      "absolute": true,
      "filename": "/absolute/path/to/log_file.log",
      "maxLogSize": 20480,
      "backups": 10,
      "category": "absolute-logger"          
    }
  ]
}
```    

