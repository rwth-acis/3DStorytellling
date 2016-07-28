browser = {};

browser.init = function (eM) {
  yjsSync().done(function(y) {
    var $addStory = $('#plus_button_stories'),
        $elem = document.querySelector('story-browser'),
        $loaded = $('#loaded_dialog'),
        $linked = $('#link_dialog'),
        $redirector = $linked.find('#space_redirector'),
        $addModel = $('#plus_button_models'),
        $addModelDialoge = $('#add_model'),
        $modelForm = $('#model_form'),
        $modelSubmit = $('#model_submit'),
        $modelsAjax = $('#models_ajax'),
        $sureDialog = $('#sure_dialog'),
        $sureButton = $('#sure_button'),

        editorMode = eM,
        selectedModel = null,
        context = null,
        iwcClient = new Las2peerWidgetLibrary(conf.external.LAS,
                                              function () {}, "ATTRIBUTE");

        _init = function () {
          window.y = y;

          $addModel.on('click', openAddModelDialoge);
          $modelForm.submit(previewModel);
          $modelSubmit.on('click', submitModel);
          $sureButton.on('click', sure);
          $elem.addEventListener('deleteModel', openDeleteModelDialoge);
          $elem.addEventListener('loadStory', loadStory);
          $elem.addEventListener('editStory', editStory);
          $elem.addEventListener('loadModel', loadModel);
          $elem.addEventListener('editModel', editModel);
        };

    var sure = function (e) {
      if (context == 'deleteModel') {
        deleteModel(selectedModel).then(function () {
          $sureDialog[0].close();
          $modelsAjax[0].generateRequest();
        });
      }
    };

    var previewModel = function (e) {
      var values = util.serializeForm($modelForm);
      
      loadModel({detail:{url:values.modelURL}});
        
      return false;
    };

    var submitModel = function (e) {
      var values = util.serializeForm($modelForm);

      iwcClient.sendRequest('post', '3DST/models', JSON.stringify(values),
                            'application/json',
                            function (data, type) {
                              $addModelDialoge[0].close();
                              $modelsAjax[0].generateRequest();
                            },
                            function (error) {
                              console.log(error);
                            });

      return false;
    };


    var deleteModel = function (id) {

      var deferred = $.Deferred();
      
      iwcClient.sendRequest('delete', '3DST/models/'+id, "",
                            'application/json',
                            function (data, type) {
                              $modelsAjax[0].generateRequest();
                              deferred.resolve();
                            },
                            function (error) {
                              console.log(error);
                              deferred.resolve();
                            });

      return deferred.promise();
    };

    var openDeleteModelDialoge = function (e) {
      selectedModel = e.detail.id;
      context = 'deleteModel';
      $sureDialog[0].open();
    };

    var openAddModelDialoge = function (e) {
      console.log('click');
      $addModelDialoge[0].open();
    };

    var loadStory = function (e) {
      appendStory(false, e.detail.id);
    };
    
    var editStory = function (e) {
      appendStory(true, e.detail.id);
    };
    
    var loadModel = function (e) {
      window.y.share.data.set('model3d', e.detail.url);
    };
    
    var editModel = function (e) {
      appendStory(true, e.detail.id);
    };

    var appendStory = function (toEditor, id) {
      var path = conf.external.STORY_ROOT+'story_'+id+'.json'; 
      $.getJSON(path, function (res) {
        if (editorMode != toEditor) {
          var space = toEditor ? conf.external.editor : conf.external.viewer;
          crossLoad(space, res)
            .then(function () {
              $redirector.attr('href', conf.external.ROLE + 'spaces/' + space);
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
