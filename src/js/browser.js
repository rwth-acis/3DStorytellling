browser = {};

browser.init = function (eM) {
  yjsSync().done(function(y) {
    var $addStory = $('#plus_button_stories'),
        $poly = document.querySelector('story-browser'),
        $loaded = $('#loaded_dialog'),
        $linked = $('#link_dialog'),
        $redirector = $linked.find('#space_redirector'),
        $addModel = $('#plus_button_models'),
        $addModelDialog = $('#add_model'),
        $editStoryDialog = $('#edit_story'),
        $modelForm = $('#model_form'),
        $modelSubmit = $('#model_submit'),
        $storySubmit = $('#story_submit'),
        $modelsAjax = $('#models_ajax'),
        $sureDialog = $('#sure_dialog'),
        $sureButton = $('#sure_button'),

        editorMode = eM,
        selectedModel = null,
        selectedStory = null,
        context = null,
        onEditModelClose = null,
        iwcClient = new Las2peerWidgetLibrary(conf.external.LAS,
                                              function () {}, "ATTRIBUTE");

        _init = function () {
          window.y = y;

          $addModel.on('click', function (e) {
            context = 'addModel';
            openAddModelDialog(e, null);
          });
          $addStory.on('click', addStoryButtonClick);
          $modelForm.submit(previewModel);
          $modelSubmit.on('click', submitModel);
          $storySubmit.on('click', submitStory);
          $sureButton.on('click', sure);
          $poly.addEventListener('deleteModel', openDeleteModelDialog);
          $poly.addEventListener('loadStory', loadStory);
          $poly.addEventListener('editStory', editStoryClick);
          $poly.addEventListener('loadModel', loadModel);
          $poly.addEventListener('editModel', editModel);
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
      if (context == 'addModel') {
        iwcClient.sendRequest('post', '3DST/models', JSON.stringify(values),
                              'application/json',
                              function (data, type) {
                                $addModelDialog[0].close();
                                $modelsAjax[0].generateRequest();
                              },
                              function (error) {
                                console.log(error);
                              });        
      } else if (context == 'editModel') {
        iwcClient.sendRequest('put', '3DST/models/'+selectedModel, JSON.stringify(values),
                              'application/json',
                              function (data, type) {
                                $addModelDialog[0].close();
                                $modelsAjax[0].generateRequest();
                              },
                              function (error) {
                                console.log(error);
                              });

      }

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

    var openDeleteModelDialog = function (e) {
      selectedModel = e.detail.id;
      context = 'deleteModel';
      $sureDialog[0].open();
    };

    var openAddModelDialog = function (e, d) {
      var data = d || {name:"",url:"",description:""};
      $addModelDialog.find('[name="modelName"]').val(data.name);
      $addModelDialog.find('[name="modelURL"]').val(data.url);
      $addModelDialog.find('[name="modelDescription"]').val(data.description);
      
      $addModelDialog[0].open();
    };

    var loadModel = function (e) {
      window.y.share.data.set('model3d', e.detail.url);
    };
    
    var editModel = function (e) {
      context = 'editModel';
      selectedModel = e.detail.data.id;
      openAddModelDialog(e, e.detail.data);
    };

    ///////////////////////////////////////////////////////////////
    // Story Related
    ///////////////////////////////////////////////////////////////

    var submitStory = function (e) {
      $editStoryDialog[0].close();
      onEditModelClose();
    };

    var addStoryButtonClick = function (e) {
      
      if (editorMode) {
        onEditModelClose = function () {
          console.log('TODO: PERSISTENCE');
        };
      } else {
        onEditModelClose = function () {
          console.log('TODO: PERSISTENCE');
          $redirector.attr('href', conf.external.ROLE + 'spaces/' +
                           conf.external.editor);
          $linked[0].open();
        };
      }
      var data = e.detail.data;
      $editStoryDialog.find('[name="storyName"]').val('');
      $editStoryDialog.find('[name="storyDescription"]').val('');
      $editStoryDialog[0].open();
      
    };
    
    var loadStory = function (e) {
      appendStory(false, e.detail.id);
    };
    
    var editStoryClick = function (e) {

      if (editorMode) {
        onEditModelClose = function () {
          console.log('TODO: PERSISTENCE');
        };
        var data = e.detail.data;
        $editStoryDialog.find('[name="storyName"]').val(data.name);
        $editStoryDialog.find('[name="storyDescription"]')
          .val(data.description);
        $editStoryDialog[0].open();
      } else {
        appendStory(true, e.detail.id)
          .then(function (sameSpace) {
            if (sameSpace) {
              $loaded[0].open();
            } else {
              $linked[0].open();
            }
          });
      }
    };
    
    var appendStory = function (toEditor, id) {
      var deferred = $.Deferred();
      var path = conf.external.STORY_ROOT+'story_'+id+'.json'; 
      $.getJSON(path, function (res) {
        if (editorMode != toEditor) {
          var space = toEditor ? conf.external.editor : conf.external.viewer;
          crossLoad(space, res)
            .then(function () {
              $redirector.attr('href', conf.external.ROLE + 'spaces/' + space);
              deferred.resolve(false);
            });
        } else {
          window.y.share.data.set('model', res);
          deferred.resolve(true);
        }
      });

      return deferred;
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
