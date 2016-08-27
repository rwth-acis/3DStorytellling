browser = {};
window.sem = {};

browser.init = function (eM) {
  yjsSync().done(function(y) {
    var $addStory = $('#plus_button_stories'),
        $confirm = $('#confirm')[0],
        $saveStory = $('#save_button_stories'),
        $refreshButton = $('#refresh_button'),
        $poly = document.querySelector('story-browser'),
        $loaded = $('#loaded_dialog'),
        $linked = $('#link_dialog'),
        $redirector = $linked.find('#space_redirector'),
        $editStoryDialog = $('#edit_story'),
        $storyForm = $('#story_form'),
        $drawer = $('#drawer'),
        $list = $('#story_list'),
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
        semresult = null,
        blocker = new util.Blocker(conf.general.refresh_timeout),
        iwcClient = new Las2peerWidgetLibrary(conf.external.LAS,
                                              function () {}, "ATTRIBUTE");

        _init = function () {
          window.y = y;
          
          if (editorMode) {
            syncmeta.init(y);
            util.subscribeY(syncmeta, storyChanged);
            
            y.share.data.observe(storyUpdated);
          }
          
          $menuButton.on('click', function () {
            $drawer[0].toggle();
          });
          $addStory.on('click', addStoryButtonClick);
          $saveStory.on('click', saveStoryButtonClick);
          $refreshButton.on('click', refresh);
          $storySubmit.on('click', submitStory);
          $sureButton.on('click', sure);
          $poly.addEventListener('loadStory', loadStory);
          $poly.addEventListener('refresh', afterRefresh);
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

    var refresh = function () {
      $storiesAjax[0].generateRequest();
    };

    var afterRefresh = function () {
      semcheck();
    };
    
    ///////////////////////////////////////////////////////////////
    // Story Related
    ///////////////////////////////////////////////////////////////


    /**
     * Callback for when the story changed
     */
    var changes = 0;
    var storyUpdated = function (events) {
      if (changes <= 0) {
        return;
      }
      console.log("browser applies change");
      changes--;
      blocker.execute(function () {
        semcheck();
      });
    };

    var semcheck = function () {
      var deferred = $.Deferred();

      var model = window.y.share.data.get('model');
      var name = util.getModelAttribute(model, 'Description');
      iwcClient.sendRequest('PUT', 'CAE/semantics',
                            JSON.stringify(model),
                            'application/json',
                            function (data, type) {
                              var entry = $list.find('#entry_'+name);
                              if (JSON.parse(data).error == 0) {
                                console.log('noerror');
                                entry.find('#err_icon').prop('hidden', true);
                                if (window.sem.hasOwnProperty(name)) {
                                  delete window.sem[name];
                                }
                                syncmeta.setAttributeValue('modelAttributes',
                                                           '_semcheck', true);
                                $poly.expandResponse();
                              } else {
                                var msg = parseSemanticError(data);
                                window.sem[name] = msg;
                                $poly.expandResponse();
                                syncmeta.setAttributeValue('modelAttributes',
                                                           '_semcheck', false);
                              }
                              deferred.resolve();
                            },
                            function (error, xhr) {
                              handleSubmitError(error);
                              console.log(error);
                              deferred.fail();
                            });
      return deferred.promise();
    };

    var storyChanged = function (events) {
      console.log("browser noticed change", events);
      changes = conf.general.reload_trials;
    };

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
      var name = util.getModelAttribute(model, 'Description');

      $editStoryDialog.find('[name="storyName"]').val(name);
      $editStoryDialog[0].open();

      onEditModelClose = function () {
        var values = util.serializeForm($storyForm);
        console.log(values);
        var newname = values.storyName;

        var model = window.y.share.data.get('model');
        var name = util.getModelAttribute(model, 'Description');
        
        //*******************
        // Warning: The CAE backend determines the name by looking at:
        // attributes.label.value.value
        // There is of course no valid SyncMeta API to collaboratively change
        // this value, because it technically describes the name of the
        // "Model Attributes" node, and should not have any other value!
        // However, I don't have the time to make this change to CAE, and
        // therefore stick to this odd behaviour. In order to be able to
        // collaboratively manipulate the story name, I use the
        // otherwise currently unused "Description" model attributte, and
        // write it to the label value only shortly before submission to CAE.
        model.attributes.label.value.value = newname;
        // ******************
        
        syncmeta.setAttributeValue('modelAttributes', 'Description', newname);

        semcheck().then(function () {
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
                                            console.log('model stored', data,
                                                        type);
                                          },
                                          function (error, xhr) {
                                            handleSubmitError(error);
                                            console.log(error);
                                          });
                         });
          
        });
      };
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

    var parseSemanticError = function (e) {
      e = JSON.parse(e);
      var node = e.node;
      var descr = e.description;

      if (node != null) {
        node = new Story(window.y.share.data.get('model'))
          .getNodeAttributes(node)['Title'] || "[Untitled]";
        return descr+' at a node titled "'+node+'"';
      } else {
        return descr;
      }
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
          console.log('appending story');
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
        console.log('cross loading');
        crossLoad(space, obj)
          .then(function () {
            $redirector.attr('href', conf.external.ROLE + 'spaces/' + space);
            $confirm.popup('You will now be redirected to the editor', 'Ok')
            deferred.resolve(false);
          });
      } else {
        console.log('loading info same space');
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
