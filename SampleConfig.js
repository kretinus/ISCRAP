// --|  Config

module.exports = {
	
  // --| Amazon ec2 manager options and credentials
  aws: {
	  regionEU1: ['eu-west-1','ami-f95ef58a', 'iScrapKeyPair','Amazon Linux', '$0.007/H'],
      regionUS1: ['us-east-1', 'ami-6869aa05', 'iScrapKeyPairUS1', 'Amazon Linux', '$0.0065/H'],
	  accessKeyId: 'AWS KEY ID',
	  secretAccessKey: 'AWS ACCES KEY',
  },
  
  // --| Scrapping module options and credentials
  populate: {
    size: 100,
    youtubeAPIkey: 'Google API key',
    youtubeUrl: 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=trailer+' 
  },

  // --| Download Batch Options
  batch: {
    size: 30,
    downloadFolder: 'ddl_batch',
    //--max-redirect=0 if redirect -> captcha
  	//--content-disposition to get the correct filename
    wgetOptions: '--max-redirect=0 --content-disposition --no-cache --no-cookies -P'

  },

  // --| Mongo Config
  mongo: {
        connectUrl: 'user:pass@host/db'
  },

  opensubtitles: {
    srcUrl: "http://dl.opensubtitles.org/en/download/vrf-108d030f/sub/"
  },

  ImDB: {
    srcUrl: "http://www.imdb.com/title/tt0"
  }
}
