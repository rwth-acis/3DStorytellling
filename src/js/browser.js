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
        $editStoryDialog = $('#edit_story'),
        $storyForm = $('#story_form'),
        $drawer = $('#drawer'),
        $menuButton = $('#menu_button'),
        $storySubmit = $('#story_submit'),
        $storiesAjax = $('#stories_ajax').attr('url', conf.external.LAS+
                                               '/CAE/models'),
        $sureDialog = $('#sure_dialog'),
        $sureButton = $('#sure_button'),
        $toastFail = $('#toast_fail'),
        $toastWin = $('#toast_win'),

        editorMode = eM,
        selectedStory = null,
        context = null,
        iwcClient = new Las2peerWidgetLibrary(conf.external.LAS,
                                              function () {}, "ATTRIBUTE");

        _init = function () {
          window.y = y;

          $menuButton.on('click', function () {
            $drawer[0].toggle();
          });
          $addStory.on('click', addStoryButtonClick);
          $saveStory.on('click', saveStoryButtonClick);
          $storySubmit.on('click', submitStory);
          $sureButton.on('click', sure);
          $poly.addEventListener('loadStory', loadStory);
          $poly.addEventListener('editStory', editStoryClick);
          $poly.addEventListener('deleteStory', deleteStoryClick);
        };
    
    var sure = function (e) {
      if (context == 'deleteModel') {
        deleteModel(selectedModel).then(function () {
          $sureDialog[0].close();
          $modelsAjax[0].generateRequest();
        });
      }
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
        iwcClient
          .sendRequest('POST', 'CAE/models',
                       JSON.stringify(model),
                       'application/json',
                       function (data, type) {
                         console.log('model stored', data, type);
                         $storiesAjax[0].generateRequest();
                       },
                       function (error, xhr) {
                         console.log('errror', error, xhr);
                         if (xhr.status == 400) {
                           handleSubmitError(error, xhr);
                           return;
                         }
                         iwcClient
                           .sendRequest('PUT', 'CAE/models/'+newname,
                                        JSON.stringify(model),
                                        'application/json',
                                        function (data, type) {
                                          $storiesAjax[0].generateRequest();
                                          $toastWin[0].open();
                                          console.log('model stored', data, type);
                                        },
                                        function (error, xhr) {
                                          handleSubmitError(error);
                                          console.log(error);
                                        });
                       });
      };
      
      var data = e.detail.data;
      $editStoryDialog.find('[name="storyName"]').val(name);
      $editStoryDialog[0].open();
    };

    var handleSubmitError = function (e, xhr) {
      try {
        e = JSON.parse(e);
      } catch (ex) {
        $toastFail.attr('text', e+" Press [Escape] to close.");
        $toastFail[0].open();
        return;
      }
      var node = e.node;
      var descr = e.description;
      var exit = '. The story will not be published until this is fixed. Press Escape to close!'

      if (node != null) {
        node = new Story(window.y.share.data.get('model'))
          .getNodeAttributes(node)['Title'] || "[Untitled]";
        $toastFail.attr('text', descr+' at a node titled "'+node+'"'+exit);
      } else {
        $toastFail.attr('text', descr+exit);
      }
      
      $toastFail[0].open();
    };
    
    var addStoryButtonClick = function (e) {

      $confirm.popup('Are you sure?', 'Yes')
        .then(function () {
          appendStory(true);
        });
      
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
