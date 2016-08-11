narrator = {};

/**
 * Initializes the narrator's logic
 * @param {bool} editorMode
 */
narrator.init = function (eM) {
  yjsSync().done(function(y) {
    
    var $undo = $('#undo_button').prop('disabled', true),
        //$refresh = $('#refresh_button').prop('disabled', true),
        $storyTitle = $('#story_title'),
        $cardTitle = $('#card_title'),
        $cardCaption = $('#card_caption'),
        $cardMedia = $('#card_media'),
        $cardLinks = $('#card_links'),
        $cont = $('#cont'),
        $drawer = $('#drawer'),
        $menuButton = $('#menu_button'),
        $useReqs = $('#use_reqs').prop('checked', !eM),
        $cleanVisits = $('#clean_visits'),

        path = new Array(),
        visited = new Array(),
        story,
        storyReady = false,
        iwcClient,
        editorMode = eM,
        maskMode = !eM,
        blocker = new util.Blocker(conf.general.refresh_timeout),

        _init = function () {
          // IWC
          iwcClient =  new Las2peerWidgetLibrary(conf.external.LAS,
                                                 iwcCallback,
                                                 "ATTRIBUTE");
          // Yjs
          y.share.data.observe(storyChanged);
          window.y = y;
          initStory(y.share.data.get('model'));
          console.info('Story Viewer: Yjs successfully initialized');

          // Buttons
          $undo.on('click', undo);
          //$refresh.on('click', refresh);
          $menuButton.on('click', function () {
            $drawer[0].toggle();
          });
          $useReqs[0].addEventListener('change', function (e) {
            maskMode = !maskMode;
            refresh();
          });
          $cleanVisits.on('click', function () {
            visited = new Array();
          });
        };

    /**
     * INITIALIZATION
     */
    
    /**
     * Creates the story of the pure yjs data
     * @param {obj} story - yjs representation of the story graph
     */
    var initStory = function (s) {
      story = new Story(s);
      refresh();
    };
    
    /**
     * IWC
     */

    /**
     * Callback for when the story changed
     */
    var storyChanged = function (events) {
      //$refresh.prop('disabled', false);
      blocker.execute(function () {
        refresh();
        console.log('refresh narrator');
      });
    };
    
    /**
     * Callback for IWC
     */
    var iwcCallback = function (intent) {
      console.log("NARRATOR RECEIVED", intent);
      console.log('node hit:', intent.extras.payload.data);
      var payload = intent.extras.payload.data;

      if (payload.type == conf.operations.entitySelect) {
        var data = JSON.parse(payload.data);
        var id = data.selectedEntityId;
        if (Story.NODES.TYPES.MEDIA.includes(story.getNodeType(id))) {
          goTo(id, true);
        }
      }
    };


    /**
     * BUTTON FUNCTIONS
     */

    var undo = function (e) {
      var prev = path.pop();
      prev && display(prev);
      if (path.length === 0) {
        $undo.prop('disabled', true);
      }
    };

    /**
     * Re-initializes the story, keeping the current state if one was set
     */
    var refresh = function (e) {
      story.update(window.y.share.data.get('model'));
      $storyTitle.text(story.getName() || lang.NO_NAME);
      if (story.isEmpty()) {
        showTutorial();
      } else if (!story.getState()) {
        var entry = story.getEntryNode();
        if (entry) {
          visited.push(entry);
          story.setState(entry);
          story.setStart(entry);
          display(story.getState());
        } else {
          showNoBegin();
        }
      } else {
        display(story.getState(), true);
      }

      //$refresh.prop('disabled', true);     
    };

    /**
     * Changes the story page to display
     * @param {int} id 
     * @param {bool} hide - no iwc should happen in case story switch was 
     *                      already caused by one
     */
    var goTo = function (id, hide) {
      path.push(story.getState());
      display(id, hide);
      $undo.prop('disabled', false);
    };

    
    /**
     * MISC
     */

    var showTutorial = function () {
      console.log(conf.external);
      util.embedImage($cardMedia, conf.external.ROOT+'img/tut.jpg');
      $cardCaption.text(lang.TUTORIAL);
    };

    var showNoBegin = function () {
      $cardCaption.text(lang.NO_BEGIN);
    };


    /**
     * Displays a media file
     * @param {int} id 
     * @param {bool} hide - no iwc should happen in case story switch was 
     *                      already caused by one
     */
    var display = function (id, hide) {
      if (!hide) {
        iwcClient.sendSelectNode(id, story.getNodeType(id));  
      }
      story.setState(id);
      visited.push(id);
      var next = story.getStoryTransitions(id, (maskMode ? visited : null));
      var num = 0;
      var one = "";
      for (var edgeId in next) {
        if (!next.hasOwnProperty(edgeId)) {
          continue;
        }
        
        num++;
        one = edgeId;
        if (next[edgeId].name == "") {
          next[edgeId].name =
            story.getNodeAttributes(next[edgeId].target)[Story.NODES.TITLE];
        }
      }
      if (num == 1 &&
          next[one].name == story.getNodeAttributes(
            next[one].target)[Story.NODES.TITLE]) {
        next[one].name = "next";
      }
      
      var curr = story.getNodeAttributes(id);

      $cardTitle.text(curr[Story.NODES.TITLE]);

      $cardMedia.html('');
      var mediaElem = $cardMedia;
      var attrs = story.getNodeAttributes(id);
      
      switch (story.getNodeType(id)) {
      case Story.NODES.TYPES.TEXT:
        util.embedText(mediaElem, attrs[Story.NODES.MEDIA.TEXT]);
        break;
      case Story.NODES.TYPES.IMAGE:
        util.embedImage(mediaElem, attrs[Story.NODES.MEDIA.IMAGE]);
        break;
      case Story.NODES.TYPES.VIDEO:
        util.embedVideo(mediaElem, attrs[Story.NODES.MEDIA.VIDEO]);
        break;    
      }
      
      $cardCaption.text(curr[Story.NODES.CAPTION]);

      $cardLinks.html('');
      for (var edgeId in next) {
        if (!next.hasOwnProperty(edgeId)) {
          continue;
        }

        var button = document.createElement('paper-button');
        var target = next[edgeId].target;
        button.addEventListener('click', function (e) {
          window.setTimeout(function () {
            goTo(target);
          }, 200);
        });
        Polymer.dom(button).textContent = next[edgeId].name;
        $cardLinks.append(button);
      }
      
      $cont.animate({ scrollTop: (0) }, 'slow');
    };

    
    _init();
  }).fail(function(){
    console.log('Story Viewer: Yjs initialization failed');
  });
};
