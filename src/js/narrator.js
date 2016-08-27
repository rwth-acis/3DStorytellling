narrator = {};

/**
 * Initializes the narrator's logic
 * @param {bool} editorMode
 */
narrator.init = function (eM) {
  yjsSync().done(function(y) {
    
    var $undo = $('#undo_button').prop('disabled', true),
        $undo2= $('#undo_button2').prop('disabled', true),
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
        forkPath = new Array(),
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
          y.share.data.observe(storyUpdated);
          window.y = y;
          initStory(y.share.data.get('model'));
          console.info('Story Viewer: Yjs successfully initialized');
          syncmeta.init(y);
          util.subscribeY(syncmeta, storyChanged);

          // Buttons
          $undo.on('click', undo);
          $undo2.on('click', undo2);
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
    var changes = 0;
    var storyUpdated = function (events) {
      if (changes <= 0) {
        return;
      }
      console.log("narrator applies change");
      changes--;
      blocker.execute(function () {
        refresh();
        console.log('refresh narrator');
      });
    };

    var storyChanged = function (events) {
      console.log("narrator noticed change", events);
      changes = conf.general.reload_trials;
    };
    
    
    /**
     * Callback for IWC
     */
    var iwcCallback = function (intent) {
      console.log("NARRATOR RECEIVED", intent);
      console.log('node hit:', intent.extras.payload.data);
      var payload = intent.extras.payload.data;

      if (payload && payload.type == conf.operations.entitySelect) {
        var data = JSON.parse(payload.data);
        var id = data.selectedEntityId;
        if (Story.NODES.TYPES.MEDIA.includes(story.getNodeType(id))) {
          display(id);
        }
      }
    };


    /**
     * BUTTON FUNCTIONS
     */
    var undo = function (e) {
      var prev = path.pop();
      if (prev) {
        switchTo(prev, false);
        if (prev == forkPath[forkPath.length-1]) {
          forkPath.pop();
          if (forkPath.length === 0) {
            $undo2.prop('disabled', true);
          }
        }
      }
      if (path.length === 0) {
        $undo.prop('disabled', true);
      }
    };
    
    var undo2 = function (e) {
      var prev = forkPath.pop();
      if (prev) {
        switchTo(prev, false);
        while (path.pop() != prev) {}
        if (path.length === 0) {
          $undo.prop('disabled', true);
        }
      }
      if (forkPath.length === 0) {
        $undo2.prop('disabled', true);
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
//          switchTo(entry, false);
//          iwcClient.sendSelectNode(entry, story.getNodeType(entry));
          display(story.getState());
        } else {
          showNoBegin();
        }
      } else {
        var state = story.getState();
//        switchTo(entry, false);
//        iwcClient.sendSelectNode(state, story.getNodeType(state));
        display(story.getState(), true);
      }

      //$refresh.prop('disabled', true);     
    };

    /**
     * Send iwc call to switch story node.
     * puts current node on the stack
     */
    var switchTo = function (id, toStack) {
      if (toStack) {
        var curr = story.getState();
        path.push(curr);
        $undo.prop('disabled', false);
        if (Object.keys(story.getStoryTransitions(curr, true)).length > 1) {
          forkPath.push(curr);
          $undo2.prop('disabled', false);
        }
      }
      
      if (story.isNode(id)) {
        iwcClient.sendSelectNode(id, story.getNodeType(id));
      } else {
        display(id);
      }
      visited.push(id);
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
     */
    var display = function (id) {
      story.setState(id);
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
        button.setAttribute('__target', target);
        button.addEventListener('click', function (e) {
          window.setTimeout(function () {
            switchTo(e.target.getAttribute('__target'), true);
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
