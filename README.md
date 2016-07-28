# ISCRAP
Academic Projet - Subtitles scraper


# getSubTitles

Download subtitle
Recursive function

**Parameters**

-   `list`  (a list of subtitle to download)
-   `index`  (index of subtitle in the list)
-   `callback`  to call once all subtitles has been Downloaded

# getSubTitles

Download subtitle
Recursive function

**Parameters**

-   `list`  (a list of subtitle to download)
-   `index`  (index of subtitle in the list)
-   `callback`  to call once all subtitles has been Downloaded

# next

Get next subtitles in the list

# next

Process next ZIP

# next

Get next subtitles in the list

# next

Get next subtitles in the list

# next

Get next subtitles in the list

# onSubTitleDownloaded

Callback on wget finished

**Parameters**

-   `error`  
-   `stdout`  
-   `stderr`  

# onSubTitleDownloaded

Callback on wget finished

**Parameters**

-   `error`  
-   `stream`  

# uploadSubtitles

Upload subtitles ZIP file
Recursive function

**Parameters**

-   `index`  (index to parse the subtitles list)
-   `callback`  to call once all subtitles have been uploaded

# onZipUploaded

Callback on upload finished
delets the file on disk if succefully stored in DB

**Parameters**

-   `error`  

# populateMovieCollection

Download subtitle
Recursive function

**Parameters**

-   `list`  (a list of subtitle to download)
-   `index`  (index of subtitle in the list)
-   `callback`  to call once all subtitles has been Downloaded

# akaScrapper

Get next subtitles in the list

# getYoutubeTrailer

Retrieve a youtube video ID for search term "trailer + moviename + movieyear"
using youtube v3api

# ImdbtrailerScrapper

Scrap video trailer from imdb
if notice -> no trailer
not use since youtube is more accurate

# nextLang

Get next lang in the list

# getDescriptionByLang

Populate and compile handlebar template

**Parameters**

-   `lang`  
-   `movie`  
-   `subsForMovie`  

# findSubTitlesToDownload

Get a list of Subtitles to download from ToDownload Collection

**Parameters**

-   `limit`  (number of subtitle to retrieve)
-   `callback`  

# removeMovieToComplete

Remove Subtitle from ToDownload Collection

**Parameters**

-   `doc`  
-   `callback`  

# removeMovieInMovieCollectionById

Manuel "upsert" since monk doesnt handle it

**Parameters**

-   `doc`  
-   `callback`  

# saveToMovieCollection

Save Subtitle entry to Downloaded collection

**Parameters**

-   `doc`  
-   `callback`  

# removeSubTitlesToDownload

Remove Subtitle from ToDownload Collection

**Parameters**

-   `doc`  
-   `callback`  

# dropSubtitleDownloaded

Drop subtitleDownloaded collection one succesfully aggregated

**Parameters**

-   `callback`  

# incrementSubTitlesToDowloadErrorCount

Increment Subtitle Error counter in ToDownload Collection

**Parameters**

-   `doc`  
-   `callback`  

# saveSubTitleDownloaded

Save Subtitle entry to Downloaded collection

**Parameters**

-   `doc`  
-   `callback`  

# saveMovieAkas

Save Subtitle entry to Downloaded collection

**Parameters**

-   `movieId`  
-   `akas`  
-   `callback`  

# saveDescriptions

Save Subtitle entry to Downloaded collection

**Parameters**

-   `doc`  
-   `lang`  
-   `description`  

# saveTrailer

Save Subtitle entry to Downloaded collection

**Parameters**

-   `doc`  
-   `trailerId`  
-   `callback`  

# seedNewSubTitles

Store new subtitles in ToDownload Collection

**Parameters**

-   `doc`  
-   `callback`  

# saveZipfile

Store subtitles ZIP to Downloaded collection

**Parameters**

-   `fileId`  
-   `zip`  
-   `callback`  

# saveImgfile

Store image file to movieCollection

**Parameters**

-   `movieId`  
-   `imgFile`  
-   `callback`  

# findBySubID

Get a subitile by the ID

**Parameters**

-   `id`  

# findAll

Get all documents from Download collection

**Parameters**

-   `callback`  
