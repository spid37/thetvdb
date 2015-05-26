var request = require('superagent');
var Promise = require('bluebird');
var _ = require('lodash');


// search and fetch tv show details.
// calls are all (bluebird) promises
function TheTvDb() {
   // api base url
   this.baseUrl = 'https://api-dev.thetvdb.com/';

   this.token = null;
   // image url to prepend to image results
   this.imageBase = 'http://www.thetvdb.com/banners/';
}

// get request used to fetch data from api
// uses superagent in a blueird promise
TheTvDb.prototype.getRequest = function(url,query){
   var self = this;
   return new Promise(function(resolve,reject){
      request
      .get(url)
      .set('Authorization', 'Bearer '+self.token)
      .set('Accept-Language', 'en')
      .accept('application/json')
      .query(query)
      .end(function(err, res){
         if (res && res.ok) {
            var results;
            results = JSON.parse(res.text);
            // console.log(res.text);
            resolve(results);
         }else{
            //console.log(res);
            reject(new Error('Failed to get data'));
         }
      });
   });
};

// post the auth request
TheTvDb.prototype.authRequest = function(url,query){
   return new Promise(function(resolve,reject){
      request
      .post(url)
      .type('application/json')
      .accept('application/json')
      .send(query)
      .end(function(err, res){
         if (res && res.ok) {
            resolve(res.body);
         }else{
            if(err){
               return reject(err);
            }
            reject(new Error('Auth failed.'));
         }
      });
   });
};


TheTvDb.prototype.updateImagePath = function(item){
   if(item.banner){
      item.banner = this.imageBase+item.banner;
   }
   if(item.poster){
      item.poster = this.imageBase+item.poster;
   }
   if(item.fanart){
      item.fanart = this.imageBase+item.fanart;
   }

   return item;
}

TheTvDb.prototype.updateImagePaths = function(results){
   var self = this;
   _.forEach(results, function(item, key) {
      results[key] = self.updateImagePath(item);
   });
   return results;
}

// auth needs to be called before the first call
// if successful the token will be stored into the class variable
// and added on the future request.
TheTvDb.prototype.auth = function(credentials){
   var self = this;
   var url = this.baseUrl+'login';
   return self.authRequest(url, credentials ).then(function(data){
      if(data.token){
         self.token = data.token;
      }
   });
}

// search for a show.
TheTvDb.prototype.search = function(searchQuery){
   var self = this;
   var url = this.baseUrl+'search/series';
   return self.getRequest(url, { "name": searchQuery }).then(function(data){
      var output = {"results": [], "resultCount": 0 };
      if(data && data.data){
         output.results = data.data;
         output.resultCount = output.results.length;
      }
      return output;
   });
}

// get a show details, if successfil then get the top images.
TheTvDb.prototype.getShow = function(showId){
   var self = this;
   var url = this.baseUrl+"series/"+ showId;
   return self.getRequest(url).then(function(data){
      if(data && data.data){
         return data.data;
      }
      throw Error("Failed to find show: "+showId);
   });
}

TheTvDb.prototype.getShowWithImages = function(showId){
   var self = this;
   var output = {};
   return self.getShow(showId).then(function(result){
      output = result;
      return self.getSeriesImages(showId);
   }).then(function(images){
      // merge output and images.
      return _.assign(output,images);
   });
}

// get the top images and return only the url to image.
// if image type does not exist, the promise settle should
// continue with no error thrown
TheTvDb.prototype.getSeriesImages = function(showId){
   var self = this;

   var imagePromises = ['poster', 'fanart'].map(function(keyType) {
      return self.getImage(showId,keyType);
   });

   var output = { };
   return Promise.settle(imagePromises).then(function(results){
      results.forEach(function(result){
         if(result.isFulfilled()){
            var item = result.value();
            if(item && item.keyType){
               output[item.keyType] = item.fileName;
            }
         } else if (result.isRejected()) {
            console.log(result.reason()); //reason
         }
      });
      return output;
   });
}

// get all images of type for a show
// will return the higest rated image
TheTvDb.prototype.getImage = function(showId,type){
   var self = this;
   var url = this.baseUrl+'/series/'+showId+'/images/query';
   return self.getRequest(url,{ "keyType": type }).then(function(data){
      if(data && data.data){
         return self.getTopImage(data.data);
      }
      return {};
   });
}

// find the highest rating image from the results given from getImage
TheTvDb.prototype.getTopImage = function(images){
   return _.max(images, function(image) {
      return _.get(images, 'ratingsInfo.average', 0);
   });
}

module.exports = TheTvDb;
