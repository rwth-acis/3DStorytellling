var yjsSync = function (spaceTitle) {

  var deferred = $.Deferred();
  if(!spaceTitle) {
    //try to get space title from url if space promise fails
    spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('/') + 1);
    if(spaceTitle.indexOf('#') != -1||spaceTitle.indexOf('?') != -1){
      spaceTitle= spaceTitle.replace(/[#|\\?]\S*/g, '');
    }
  }
  Y({
    db: {
      name: 'memory' // store the shared data in memory
    },
    connector: {
      name: 'websockets-client', // use the websockets connector
      room: spaceTitle
//      url: 'http://134.61.178.81:1234'
    },
    share: { // specify the shared content
      users:'Map',
      undo:'Array',
      redo:'Array',
      join:'Map',
      canvas: 'Map',
      nodes:'Map',
      edges:'Map',
      userList:'Map',
      select:'Map',
      views:'Map',
      data:'Map',
      text:"Text"
    },
    sourceDir: conf.external.ROOT+'src/js/lib/vendor'
  }).then(function (y) {
    deferred.resolve(y);
  });
  return deferred.promise();
};
