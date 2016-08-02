browser = {};

browser.init = function (eM) {
  yjsSync().done(function(y) {
    var $addStory = $('#plus_button_stories'),
        $confirm = $('#confirm')[0],
        $saveStory = $('#save_button_stories'),
        $poly = document.querySelector('story-browser'),
        $loaded = $('#loaded_dialog'),
        $linked = $('#link_dialog'),
        $redirector = $linked.find('#space_redirector'),
        $addModel = $('#plus_button_models'),
        $addModelDialog = $('#add_model'),
        $editStoryDialog = $('#edit_story'),
        $modelForm = $('#model_form'),
        $storyForm = $('#story_form'),
        $modelSubmit = $('#model_submit'),
        $storySubmit = $('#story_submit'),
        $modelsAjax = $('#models_ajax').attr('url', conf.external.LAS+
                                             '/3DST/stories.json'),
        $storiesAjax = $('#stories_ajax').attr('url', conf.external.LAS+
                                               '/CAE/models'),
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
          $saveStory.on('click', saveStoryButtonClick);
          $modelForm.submit(previewModel);
          $modelSubmit.on('click', submitModel);
          $storySubmit.on('click', submitStory);
          $sureButton.on('click', sure);
          $poly.addEventListener('deleteModel', openDeleteModelDialog);
          $poly.addEventListener('loadStory', loadStory);
          $poly.addEventListener('editStory', editStoryClick);
          $poly.addEventListener('deleteStory', deleteStoryClick);
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

    var deleteStoryClick = function (e) {
      $confirm.popup('Are you sure?', 'Yes')
        .then(function () {
          iwcClient.sendRequest('DELETE', 'CAE/models/'+e.detail.name,
                                '', 'text/plain',
                               function () {
                                 $storiesAjax[0].generateRequest();
                               });
        });
    };
    
    var submitStory = function (e) {
      $editStoryDialog[0].close();
      onEditModelClose();
    };

    var saveStoryButtonClick = function (e) {

      var model = window.y.share.data.get('model');
      var name = model.attributes.label.value.value || '';
      
      onEditModelClose = function () {
        var values = util.serializeForm($storyForm);
        console.log(values);
        var newname = values.storyName;
        model.attributes.label.value.value = newname;
        // PETRU
        iwcClient
          .sendRequest('POST', 'CAE/models',
                       JSON.stringify(model),
                       'application/json',
                       function (data, type) {
                         console.log('model stored', data, type);
                         $storiesAjax[0].generateRequest();
                       },
                       function (error) {
                         console.log('errror', error);
                         iwcClient
                           .sendRequest('PUT', 'CAE/models/'+newname,
                                        JSON.stringify(model),
                                        'application/json',
                                        function (data, type) {
                                          $storiesAjax[0].generateRequest();
                                          console.log('model stored', data, type);
                                        });
                       });
      };
      
      var data = e.detail.data;
      $editStoryDialog.find('[name="storyName"]').val(name);
      $editStoryDialog[0].open();
    };
    
    var addStoryButtonClick = function (e) {

      var ap = appendStory;
      
      if (editorMode) {
        $confirm.popup('Are you sure?', 'Yes')
          .then(function () {
            return ap(true);
          })
          .then(function () {

          });
      } else {
        $confirm.popup('Are you sure?', 'Yes')
          .then(function () {
            return ap(true);
          })
          .then(function () {

          });
      }
    };
    
    var loadStory = function (e) {
      $confirm.popup('Are you sure?', 'Yes')
        .then(function () {
          appendStory(false, e.detail.name);
        });
    };
    
    var editStoryClick = function (e) {

      $confirm.popup('Are you sure?', 'Yes')
        .then(function () {
          appendStory(true, e.detail.name);
        });
      
    };
    
    var appendStory = function (toEditor, name) {
      var deferred = $.Deferred();

      if (!name) {
        load(toEditor, null).then(function () {
          deferred.resolve();
        });
      } else {
        load(toEditor, name).then(function () {
          deferred.resolve();
        });
      }

      return deferred;
    };

    var load = function (toEditor, obj) {
      var deferred = $.Deferred();
      var space = toEditor ? conf.external.editor : conf.external.viewer;
      if (editorMode != toEditor) {
        crossLoad(space, obj)
          .then(function () {
            $redirector.attr('href', conf.external.ROLE + 'spaces/' + space);
            $confirm.popup('You will now be redirected to the editor', 'Ok')
            deferred.resolve(false);
          });
      } else {
        window.y.share.data.set('model', obj);
        $confirm.popup('Please refresh the page', 'Ok')
        deferred.resolve(true);
      }
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
