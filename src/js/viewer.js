var viewer = {};

viewer.TAGS = {
  TEMP : 'temp'
};

/**
 * Initializes the viewer's logic
 * @param {bool} editorMode
 * @param {int} model - id of the model to show 
 */
viewer.init = function (eM, m) {
  yjsSync().done(function (y) {

    var $elem = $('#elem'),
        $inline = $('#inline'),
        $scene = $('#scene'),
        $currTagBox = $('#curr_tag'),
        $confirm = $('#confirm')[0],
        $navType = $('#navType'),
        $follower = $('#follower'),
        $tagHeader = $('#tag_header'),
        $tagText = $('#tag_text'),
        $tagDialog = $('#tag_dialog'),
        $currTag = $('#curr_tag'),
        $currTagButton = $('#curr_tag_button').prop('disabled',true),
        $currViewButton = $('#curr_view_button').prop('disabled',false),
        $refreshButton = $('#refresh_button'),
        $drawer = $('#drawer'),
        $modelForm = $('#model_form'),
        $menuButton = $('#menu_button'),
        $currView = $('#curr_view'),
        $currViewButton = $('#curr_view_button'),
        $poly = document.querySelector('obj-viewer'),
        
        $defaultViewButton = $('#default_view_button'),

        tagMode = false,
        iwcClient,
        story,
        stdView = null,
        tagInFocus = null,
        targetAttr = null,
        buffer = "",
        editorMode = eM,
        maskMode = !eM,
        model = "",
        cones = new Cones($scene),
        blocker = new util.Blocker(conf.general.refresh_timeout),
        coneSizeUpdateBlocker = new util.Blocker(conf.general.cones_scale_timeout),
        selection = null,
        plugin = syncMetaPlugin,

        _init = function () {
          // IWC
          iwcClient = new Las2peerWidgetLibrary(conf.external.LAS,
                                                iwcCallback,
                                                "ATTRIBUTE");
          // Yjs
          y.share.data.observe(storyUpdated);
          window.y = y;
          ySyncMetaInstance = y;
          console.info('Object Viewer: Yjs successfully initialized');
          plugin.connect(y);
          util.subscribeY(plugin, storyChanged);
          
          initStory(y.share.data.get('model'));
          model = y.share.data.get('model3d') || m;
          loadModel(model);
          
          // Buttons
          $modelForm.submit(submitModel);
          $elem[0].addEventListener('mousemove', handleMouseMove, true);
          //        $refreshButton.on('click', refresh);
          setInterval(handleOrientation, 30);
          $currView.on('click', function () {
            viewer.toClipboard('view');
          });
          $currTag.on('click', function () {
            viewer.toClipboard('tag');
          });
          $menuButton.on('click', function () {
            $drawer[0].toggle();
          });
          $currViewButton.on('click', clipboardButton);
          $currTagButton.on('click', clipboardButton);
          $defaultViewButton.on('click', toLastView);
          $inline[0].addEventListener('click', handleClick);
          $poly.addEventListener('leaveTagMode', leaveTagMode);
          $poly.addEventListener('enterTagMode', enterTagMode);
          $scene.on('tagHover', handleTagHover);
          $scene.on('tagClick', handleTagClick);
          $scene.on('tagLeave', handleTagLeave);
          $scene.on('modelLoaded', onModelLoaded);
        };


    /**
     * Callback for IWC
     */
    var iwcCallback = function (intent) {
      console.log("VIEWER RECEIVED", intent);
      switch (intent.action) {
      case conf.intents.syncmeta:
        var payload = intent.extras.payload.data;
        if (payload.type == conf.operations.entitySelect) {
          if (!story) {
            break;
          }

          var id = JSON.parse(payload.data).selectedEntityId;
          var nodeType = story.getEntityType(id);

          switch (nodeType) {
          case Story.NODES.TYPES.VIEW:
            targetAttr = Story.NODES.MEDIA.SETTING; break;
          case Story.NODES.TYPES.TAG:
            targetAttr = Story.NODES.MEDIA.TAG_POSITION; break;
          case Story.EDGES.TYPES.TRANSITION:
            targetAttr = Story.NODES.MEDIA.TRANSITION_TAG; break;
          }

          if (nodeType == Story.NODES.TYPES.TAG ||
              nodeType == Story.EDGES.TYPES.TRANSITION) {
            selectTag(id);
            $currTagButton.prop('disabled',false);
          } else {
            $currTagButton.prop('disabled',true);
            tagInFocus = null;
            show(id);
          }
        }
        break;
      }
    };

    var show = function (id) {
      id = id || selection;
      if (!id) {
        return;
      }
      var clearedTags = false;

      function clearTags() {
        if (!clearedTags) {
          console.log('CLEARING');
          cones.clear();
          clearedTags = true;
        }
      }

      function updateView(id) {
        var view = story.getView(id);
        if (view && conf.regex.view.test(view)) {
          changeView(view);
        } else {
          changeView('default');
        }
      }

      function updateTags(id) {
        var tags = story.getTags(id);
        tags.forEach(function(tag) {
          if (tag.position && conf.regex.tag.test(tag.position)) {
            cones.createFromMeta(tag);
          }
        });
      }

      function updateTransitionTags(id) {
        var next = story.getStoryTransitions(id, maskMode);
        for (var edgeId in next) {
          console.log('next', next[edgeId]);
          if (next[edgeId].tag && conf.regex.tag.test(next[edgeId].tag)) {
            cones.createFromMeta({
              position : next[edgeId].tag,
              nodeId : edgeId,
              color : conf.viewer.cones.CONE_COLOR_LINK
            });
          }
        } 
      }
      
      if (story.isNode(id)) {
        var nodeType = story.getNodeType(id);
        var isMedia = Story.NODES.TYPES.MEDIA.includes(nodeType);
        if (isMedia) {
          clearTags();
          updateTransitionTags(id);
          updateTags(id);
          story.setState(id);
        }

        if ((isMedia || nodeType == Story.NODES.TYPES.VIEW) &&
            id !== selection) {
          updateView(id);
        }

        cones.adjustSizes(getCameraPosition());
      }
      
      var nodeType = story.getEntityType(id);

      if (nodeType == Story.NODES.TYPES.VIEW) {
        viewInFocus = id;
        targetAttr = Story.NODES.MEDIA.SETTING;
        $currViewButton.prop('disabled',false);
      } else {
        $currViewButton.prop('disabled',true);
        viewInFocus = null;
      }

      selection = id;
    }

    var selectTag = function(id) {
      tagInFocus = id;
      cones.unhighlightAll();
      var cone = cones.search(id);
      if (cone) {
        cone.highlight();          
      }
    };
    
    /**
     * Creates the story of the pure yjs data
     * @param {obj} story - yjs representation of the story graph
     */
    var initStory = function (s) {
      story = new Story(s);
    };

    /**
     * Callback when story graph changed
     */
    var changes = false;
    var storyUpdated = function (events) {
      if (!changes) {
        return; 
      }
      changes = false;
      var newModel = window.y.share.data.get('model3d');
      if (newModel != model) {
        loadModel(newModel);
        model = newModel;
      }
      story.update(window.y.share.data.get('model'));
      console.log(window.y.share.data.get('model'));
      
      blocker.execute(function () {
        show();
        console.log('refresh viewer');
      });
    };
    
    var storyChanged = function (events) {
      changes = true;
    };

    var submitModel = function (e) {
      var values = util.serializeForm($modelForm);
      console.log(values);
      $confirm.popup("Changing the model won't change the position of  tags or views you already set up. Continue?", 'Yes')
        .then(function () {
          loadModel(values['modelURL']);
          $drawer[0].toggle();
        });
      return false;
    };
    
    /**
     * Tells x3dom the new URL to load model from
     */
    var loadModel = function (path) {
      console.log('loading model from: '+path);
      $inline.attr('url', path);
    };

    /**
     * Event handler for when the model is fully loaded
     */
    var onModelLoaded = function () {
      console.log('loaded');
      toStdView();
      //  changeView(calcCam());
      //  $elem[0].runtime.addEventListener("transitionend", test, false);
    };

    /**
     * Resets the camera to the default front view
     */
    var toStdView = function () {
      $elem[0].runtime.showAll();
    };

    /**
     * Puts content of text field into clipboard
     */
    var toClipboard = function () {
      if (tagMode && tagInFocus) {
        iwcClient
          .clearAttr(tagInFocus, targetAttr,
                     story.getAnyAttributes(tagInFocus)[targetAttr].length);
        iwcClient.sendAttr(tagInFocus, targetAttr, buffer);
        return true;
      } else if (!tagMode && viewInFocus) {
        iwcClient.
          clearAttr(viewInFocus,
                    Story.NODES.MEDIA.SETTING,
                    story.getNodeAttributes(viewInFocus)
                    [Story.NODES.MEDIA.SETTING].length);
        iwcClient.sendAttr(viewInFocus, Story.NODES.MEDIA.SETTING, lastView);
        return true;
      } else {
        return false;
      }
    };

    /**
     * Converts the current camera into the x3dom string
     */
    var calcCam = function () {
      var mat_view = $elem[0].runtime.viewMatrix().inverse();
      var cor = $elem[0].runtime.canvas.doc._scene
          .getViewpoint()
          .getCenterOfRotation();
      var rotation = new x3dom.fields.Quaternion(0,0,1,0);
      rotation.setValue(mat_view);
      var rot=rotation.toAxisAngle();
      var translation=mat_view.e3();
      var prec = conf.viewer.CAM_OUTPUT_PRECISION;
      var text = 
          'position="'
          +translation.x.toFixed(prec)+' '
          +translation.y.toFixed(prec)+' '
          +translation.z.toFixed(prec)+'" '
        +'orientation="'+rot[0].x.toFixed(prec)+' '
          +rot[0].y.toFixed(prec)+' '
          +rot[0].z.toFixed(prec)+' '
          +rot[1].toFixed(prec)+'" '
        +'centerOfRotation="'
          +cor.x.toFixed(prec)+' '
          +cor.y.toFixed(prec)+' '
          +cor.z.toFixed(prec)+'"';
      return text;
    };

    /**
     * Event handler for 'add to clipboard' buttons
     */
    var clipboardButton = function (type) {
      if (toClipboard(type)) {
        toast_cp.open();
      } else {
        toast_cp_fail.open();
      }
    };


    /**
     * Start making tags
     */
    var enterTagMode = function () {
      tagMode = true;
      setNavigation(false);
      $currTagBox.attr('value', 'Click somewhere');
    };

    /**
     * Stop making tags
     */
    var leaveTagMode = function () {
      tagMode = false;
      setNavigation(true);
      // cones.undoLastCone();
    };

    /**
     * Turn navigation on or off
     * @param {bool} state
     */
    var setNavigation = function (state) {
      $navType.attr('type', state ? '"any"' : '"none"');
    };

    /**
     * Event handler for clicks on the model.
     * @param {event} event 
     */
    var handleClick = function (event) {
      if (!tagMode) {
        return;
      }

      var pos_text =
          event.worldX.toFixed(conf.viewer.TAG_OUTPUT_PRECISION)+' ' +
          event.worldY.toFixed(conf.viewer.TAG_OUTPUT_PRECISION)+' ' +
          event.worldZ.toFixed(conf.viewer.TAG_OUTPUT_PRECISION);

      var dir_text =
          event.normalX.toFixed(conf.viewer.TAG_OUTPUT_PRECISION)+' '+
          event.normalY.toFixed(conf.viewer.TAG_OUTPUT_PRECISION)+' '+
          event.normalZ.toFixed(conf.viewer.TAG_OUTPUT_PRECISION);

      var text =
          'position="'+pos_text+'" '+
          'orientation="'+dir_text+'"';

      $currTagBox.attr('value', text);
      buffer = text;
      //  $currTagBox[0].select();
      cones.deleteConesByUser(viewer.TAGS.TEMP);
      var cone = cones.generateCone(viewer.TAGS.TEMP, pos_text, dir_text,
                                    conf.viewer.cones.CONE_COLOR_SELECT);
      cone.scale(getCameraPosition());
    };

    var getCameraPosition = function () {
      var mat_view = $elem[0].runtime.viewMatrix().inverse();
      var cam = mat_view.e3();
      return cam;
    };
    
    /**
     * Callback for when a tag is clicked
     * @param {Object} e - jQuery event
     * @param {int} id - id of the tag clicked
     */
    var handleTagClick = function (e, id) {
      $follower.css({visibility: 'hidden'});
      var nodeId = cones.cones[id].nodeId;
      var attrs = story.getAnyAttributes(nodeId);
      if (story.isNode(nodeId)) {
        iwcClient.sendSelectNode(nodeId, story.getNodeType(nodeId));  
        $tagHeader.text(attrs[Story.NODES.MEDIA.TAG_NAME]);
        var media = attrs[Story.NODES.MEDIA.TAG_MEDIA];
        $tagText.html('');
        if (conf.regex.image.test(media)) {
          util.embedImage($tagText, media);
        } else if (conf.regex.video.test(media)) {
          util.embedVideo($tagText, media);
        } else if (conf.regex.audio.test(media)) {
          util.embedAudio($tagText, media);
        }
        $tagText.append(attrs[Story.NODES.MEDIA.TAG_DESCRIPTION]);
        $tagDialog[0].open();
      } else {
        var adj = story.getAdjacentEdges(story.getState());
        if (adj[nodeId]) {
          iwcClient.sendSelectNode(adj[nodeId].target,
                                   story.getNodeType(adj[nodeId].target));
          
        }
      }
    };

    /**
     * Callback for when a tag is clicked
     * @param {Object} e - jQuery event
     * @param {int} id - id of the tag clicked
     */
    var handleTagHover = function (e, id) {
      var nodeId = cones.cones[id].nodeId;
      $follower.css({visibility: 'visible'});
      if (!story.isNode(nodeId)) {
        $follower.html('&rarr; '+
                       story.getAnyAttributes(nodeId)[Story.EDGES.NAME]
                      );
      } else {
        $follower.text(
          story.getAnyAttributes(nodeId)[Story.NODES.MEDIA.TAG_NAME]
        );
      }
    };

    /**
     * Callback for when a tag is clicked
     * @param {Object} e - jQuery event
     * @param {int} id - id of the tag clicked
     */
    var handleTagLeave = function (e, id) {
      var nodeId = cones.cones[id].nodeId;
      $follower.css({visibility: 'hidden'});
    };

    var lastView = "";
    /**
     * Callback for when the camera is moved
     */
    var handleOrientation = function () {
      var str = calcCam();
      // avoid redundant textbox updates. still fails sometimes though
      if (str !== lastView) {
        lastView = str;
        $currView.attr('value', str);
        cones.adjustSizes(getCameraPosition());
      }
    };
    
    var handleMouseMove = function (e) {
      $follower.css({left:e.clientX, top:e.clientY});
    };


    var lastViewSet = null;

    var currIndex = 0;
    var ring = [];
    /**
     * Moves the camera to a specific point and angle
     * @param {string} view - position="x y z" orientation="x y z t"
     */
    var changeView = function (view) {

      console.log('VIEW IS', view);
      if (view == 'default') {
        toStdView();
      } else {
        var id = 'view_'+currIndex;
        var existing = $scene.find('#'+id);
        if (existing.length !== 0) {
          existing.remove();
        }
        $scene.append(
          '<Viewpoint id="'+id+'" '+view+
            ' description="camera" set_bind="true"></Viewpoint>'
        );
        $scene.find('#'+id).attr('set_bind', 'true');
        currIndex = (currIndex+1) % 3;
      }

      lastViewSet = view;
    };

    /**
     * Moves the camera to the last view that has been explicitly set
     */
    var toLastView = function () {
      changeView(lastViewSet || calcCam());
    };

    _init();
  });
}



/**
 * Manages the tags (cones) on an object
 */
var Cones = function (scene) {
  this.lastCone = null;
  this.cones = {};
  this.$scene = scene;
};

/**
 * Put a cone onto the model
 * @param {string} author - Author ID
 * @param {string} pos - Position in "x y z"
 * @param {string} dir - Surface normal in "x y z"
 * @param {string} color - Color in "r g b"
 * @param {float} size - Size
 * @param {float} transparency - Transparency
 * @return {} generated cone
 */
Cones.prototype.generateCone = function (author, pos, dir, color, size, transparency) {
  var cone = new Cone(author, pos, dir, color, size, transparency);
  if (!this.cones.hasOwnProperty(cone.getId())) {
    cone.appendToScene(this.$scene);
    this.lastCone = cone.getId();
    this.cones[cone.getId()] = cone;
    return cone;
  } else {
    return this.cones[cone.getId()];
  }
};

Cones.prototype.createFromMeta = function (data) {
  var info = data.position.split('"');
  var cone = this.generateCone(null, info[1], info[3], data.color);
  cone.nodeId = data.nodeId;
};

Cones.prototype.search = function (nodeId) {
  for (var id in this.cones) {
    if (this.cones.hasOwnProperty(id)) {
      if (this.cones[id].nodeId == nodeId) {
        return this.cones[id];
      }
    }
  }
  return null
};

Cones.prototype.unhighlightAll = function () {
  for (var id in this.cones) {
    if (this.cones.hasOwnProperty(id)) {
      this.cones[id].unhighlight();
    }
  }
};

/**
 * Remove the previously added cone
 */
Cones.prototype.deleteConesByUser = function (user) {
  for (var id in this.cones) {
    if (this.cones.hasOwnProperty(id)) {
      if (this.cones[id].author == viewer.TAGS.TEMP) {
        this.deleteCone(id);      
      }
    }
  }
};

/**
 * Removes a cone
 * @param {string} id
 */
Cones.prototype.deleteCone = function (id) {
  this.cones[id].removeFromScene();
  delete this.cones[id];
};

/**
 * Removes all cones
 */
Cones.prototype.clear = function () {
  for (var id in this.cones) {
    if (!this.cones.hasOwnProperty(id)) {
      continue;
    }

    this.deleteCone(id);
  }
};

Cones.prototype.adjustSizes = function (cam) {
  for (var id in this.cones) {
    if (!this.cones.hasOwnProperty(id)) {
      continue;
    }
    
    this.cones[id].scale(cam);
//    console.log(distance);
//    this.cones[id].
  }
};


/**
 * Cone constructor
 * @param {string} pos - Position in "x y z"
 * @param {string} dir - Surface normal in "x y z"
 * @param {string} color - Color in "r g b"
 * @param {float} size - Size
 */
var Cone = function (author, pos, dir, color, size) {
  var pos = pos || '0 0 0';
  var dir = dir || '0 -1 0';

  var dirvec = x3dom.fields.SFVec3f.parse(dir);
  dirvec = dirvec.add(new x3dom.fields.SFVec3f(0, -1, 0));
  if (dirvec.at(1) == 0) {
    dirvec = dirvec.add(new x3dom.fields.SFVec3f(0, 0.0001, 0));
  }
  dirvec = dirvec.normalize();
  var size = size || conf.viewer.cones.CONE_SIZE;
  var color = color || conf.viewer.cones.CONE_COLOR;
  var id = util.hashString(pos+""+dir+""+size+""+color);
  var tag = 'cone_' + id;

  var $elem = $('<transform></transform>').attr({
    id : tag,
    translation : pos,
    center : '0 1 0',
    scale : size+' '+size*2+' '+size,
    rotation : dirvec.toString()+" "+Math.PI,
  }).append($('<shape></shape>').attr({
    id : 'shape'
  }).append($('<appearance></appearance>').append($('<material></material>').attr({
    id : 'color',
    diffuseColor : color,
    transparency : conf.viewer.cones.TRANSPARENCY_DEFAULT
  }))).append('<cone></cone>'));

  this.id = id;
  this.tag = tag;
  this.$elem = $elem;
  this.author = author;
  this.size = size;
  this.position = x3dom.fields.SFVec3f.parse(pos);
};

/**
 * Returns the id
 */
Cone.prototype.getId = function () {
  return this.id;
};

/**
 * Appends the cones' html to the scene
 * @param {element} scene - jQuery element of the scene
 */
Cone.prototype.appendToScene = function (scene) {
  scene.append(this.$elem);
  var me = this;
  var $shape = this.$elem.find('#shape')[0];
  $shape.addEventListener('click', function () {
    scene.trigger('tagClick', me.id);
  });
  $shape.addEventListener('mouseover', function () {
    scene.trigger('tagHover', me.id);
    me.highlight();
  });
  $shape.addEventListener('mouseout', function () {
    scene.trigger('tagLeave', me.id);
    me.unhighlight();
  });
};

/**
 * Removes cone from the scene to which it was added to
 */
Cone.prototype.removeFromScene = function () {
  this.$elem.remove();
};

/**
 * Removes cone from the scene to which it was added to
 */
Cone.prototype.scale = function (cam) {
  var scl = this.position.subtract(cam).length()/conf.viewer.cones.CONE_SCALE;
  this.$elem.attr('scale', scl+' '+scl*2+' '+scl);
};

Cone.prototype.highlight = function () {
  this.$elem.find('#color').attr(
    'transparency', conf.viewer.cones.TRANSPARENCY_HIGHLIGHT
  );
};

Cone.prototype.unhighlight = function () {
  this.$elem.find('#color').attr(
    'transparency', conf.viewer.cones.TRANSPARENCY_DEFAULT
  );
};
