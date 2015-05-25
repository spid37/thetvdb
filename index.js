var request = require('superagent');
var Promise = require("bluebird");
var _ = require("lodash");

function TheTvDb() {
   this.baseUrl = "https://api-dev.thetvdb.com/";
   this.token = null;

   this.imageBase = 'http://www.thetvdb.com/banners/';

   TheTvDb.prototype.getRequest = function(url,query){
      var self = this;
      return new Promise(function(resolve,reject){
         request
         .get(url)
         .set('Authorization', 'Bearer '+self.token)
         .set('Accept-Language', "en")
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
               reject(new Error("failed to get data"));
            }
         });
      });
   };

   TheTvDb.prototype.postRequest = function(url,query){
      console.log(url);
      return new Promise(function(resolve,reject){
         request
         .post(url)
         .type('application/json')
         .accept('application/json')
         .send(query)
         .end(function(err, res){
            if (res && res.ok) {
               var results;
               results = res.body;
               resolve(results);
            }else{
               console.log(res);
               reject(new Error("failed to get data"));
            }
         });
      });
   };


   TheTvDb.prototype.updateImagePath = function(item,imageKey){
      if(item[imageKey]){
         item[imageKey] = this.imageBase+item[imageKey];
      }
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

   TheTvDb.prototype.updateImagePaths = function(results,keyName){
      var self = this;
      _.forEach(results, function(item, key) {
         results[key] = self.updateImagePath(item,keyName);
      });
      return results;
   }

   TheTvDb.prototype.auth = function(searchQuery){
      var self = this;
      var endPoint = this.baseUrl+"login";
      return self.postRequest(endPoint, config.tvdb.auth ).then(function(data){
         if(data.token){
            self.token = data.token;
         }
      });
   }

   TheTvDb.prototype.search = function(searchQuery){
      var self = this;
      var endPoint = this.baseUrl+"search/series";
      return self.getRequest(endPoint, { "name": searchQuery }).then(function(data){
         var output = {"results": [], "resultCount": 0 };
         if(data && data.data){
            output.results = self.updateImagePaths(data.data);
            output.resultCount = output.results.length;
         }
         return output;
      });
   }

   TheTvDb.prototype.getShow = function(showId){
      var self = this;
      var endPoint = this.baseUrl+"series/"+ showId;
      var output = {};
      return self.getRequest(endPoint).then(function(data){
         if(data && data.data){
            output = self.updateImagePath(data.data);
            return output;
         }
         throw Error("Failed to find show: "+showId);
      }).then(function(){
         return self.getSeriesImages(showId);
      }).then(function(images){
         return _.assign(output,images);
      });
   }

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

   TheTvDb.prototype.getImage = function(showId,type){
      var self = this;
      var endPoint = this.baseUrl+"/series/"+showId+"/images/query";
      return self.getRequest(endPoint,{ "keyType": type }).then(function(data){
         if(data && data.data){
            var images = self.updateImagePaths(data.data,"fileName");
            return self.getTopImage(images);
         }
         return {};
      });
   }

   TheTvDb.prototype.getTopImage = function(images){
      return _.max(images, function(image) {
         return _.get(images, 'ratingsInfo.average', 0);
      });
   }

   module.exports = TheTvDb;
