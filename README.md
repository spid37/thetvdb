# thetvdb
Node.js library to access thetvdb's new (dev) API

var auth = {
   "apikey": "theapikey",
   "username": "theusername",
   "userpass": "thepassword"
}

var tv = new TheTvDb();

## search for a tv show
tv.auth(config.tvdb.auth).then(function(data){
   return tv.search(search);
}).then(function(results){
   console.log(results);
}).error(function(err){
   console.log(err.message);
});

#### search results
{ 
  results: [ {
    aliases: [],
    firstAired: '2012-06-15',
    id: 259972,
    network: 'Disney Channel',
    overview: 'Twin brother and sister Dipper and Mabel Pines are in for an unexpected adventure when they spend the summer helping their great uncle Stan run a tourist trap in the mysterious town of Gravity Falls, Oregon.',
    poster: 'graphical/259972-g5.jpg',
    seriesName: 'Gravity Falls',
    status: 'Continuing' 
  } ],
  resultCount: 1 
}

## get tv show details.
tv.auth(config.tvdb.auth).then(function(data){
   return tv.getShowWithImages(259972);
}).then(function(result){
   console.log(result);
}).error(function(err){
   console.log(err.message);
});

### show result for id 259972

{ 
  id: 259972,
  seriesName: 'Gravity Falls',
  aliases: [],
  poster: 'posters/259972-1.jpg',
  seriesId: '80670',
  status: 'Continuing',
  firstAired: '2012-06-15',
  network: 'Disney Channel',
  networkId: '',
  runtime: '30',
  genre: [ 'Animation', 'Comedy', 'Fantasy' ],
  actors: [],
  overview: 'Twin brother and sister Dipper and Mabel Pines are in for an unexpected adventure when they spend the summer helping their great uncle Stan run a tourist trap in the mysterious town of Gravity Falls, Oregon.',
  lastUpdated: 1432474457,
  airsDayOfWeek: 'Friday',
  airsTime: '9:30 PM',
  rating: 'TV-Y7',
  imdbId: 'tt1865718',
  zap2itId: 'EP01566290',
  added: '2012-06-15 13:05:55',
  addedBy: 201821,
  fanart: 'fanart/original/259972-1.jpg' 
}
