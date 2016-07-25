browser = {};

browser.init = function (eM) {
  yjsSync(eM ? conf.y.ROOM_EDITOR : conf.y.ROOM_VIEWER).done(function(y) {
    var $plus = $('#plus_button'),
        $elem = document.querySelector('story-browser'),
        $loaded = $('#loaded_dialog'),
        $linked = $('#link_dialog'),
        $redirector = $linked.find('#space_redirector'),

        editorMode = eM,

        _init = function () {
          window.y = y;

          $plus.on('click', plus);
          $elem.addEventListener('loadStory', loadStory);
          $elem.addEventListener('editStory', editStory);
        };

    var plus = function (e) {
      
    };

    var loadStory = function (e) {
      appendStory(false, e.detail.id);
    };
    
    var editStory = function (e) {
      appendStory(true, e.detail.id);
    };

    var appendStory = function (toEditor, id) {
      var path = conf.external.STORY_ROOT+'story_'+id+'.json'; 
      $.getJSON(path, function (res) {
        if (editorMode != toEditor) {
          crossLoad(toEditor ? conf.y.ROOM_EDITOR : conf.y.ROOM_VIEWER, res)
            .then(function () {
              $redirector.attr('href', conf.external.ROLE +
                               'spaces/' +
                               (toEditor ? conf.external.editor : conf.external.viewer));
              $linked[0].open();
            });
        } else {
          window.y.share.data.set('model', res);
          $loaded[0].open();
        }
      });
    };

    var crossLoad = function (room, model) {
      var deferred = $.Deferred();
      
      yjsSync(room).done(function (yInstance) {
        yInstance.share.data.set('model', model);
        deferred.resolve();
      });

      return deferred.promise();
    };

    _init();
  });
};
