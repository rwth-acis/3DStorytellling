var viewer = {};

viewer.TAGS = {
  TEMP : 'temp'
};

// The x3dom element (jQuery)
viewer.elem;

// The x3dom inline to load the object (jQuery)
viewer.inline;

// The x3dom scene element (jQuery)
viewer.scene;

viewer.tagMode = false;

viewer.iwcClient;

viewer.story;

viewer.stdView = null;

// node ID of the tag in focus
viewer.tagInFocus = null;

viewer.buffer = "";

/**
 * Initializes the viewer's logic
 * @param {bool} editorMode
 * @param {int} model - id of the model to show 
 */
viewer.init = function (editorMode, model) {
  var me = viewer;

  // pretend to be the attribute widget, in order to receive the canvas' messages
  me.iwcClient = new Las2peerWidgetLibrary(conf.external.LAS, viewer.iwcCallback, "ATTRIBUTE");
  
  $(function () {
    me.elem = $('#elem');
    me.inline = $('#inline');
    me.scene = $('#scene');
    me.elem[0].addEventListener("mousemove", me.handleOrientation, true);
  });

  yjsSync().done(function(y){
    
    function initY () {
      window.y = y;
      console.info('Object Viewer: Yjs successfully initialized');
      viewer.initStory(y.share.data.get('model'));
      y.share.data.observe(viewer.storyChanged);
      console.log(y.share.data.get('model'));
      me.loadModel(model);
    }
    initY();

  }).fail(function(){
    window.y= undefined;
    console.log('3D Object Viewer: Yjs initialization failed');
  });
};

/**
 * Callback for IWC
 */
viewer.iwcCallback = function (intent) {
  console.log("VIEWER RECEIVED", intent);
  switch (intent.action) {
  case conf.intents.syncmeta:
    var payload = intent.extras.payload.data;
    if (payload.type == conf.operations.entitySelect) {
      var data = JSON.parse(payload.data);
      var view = viewer.story.getView(data.selectedEntityId);
      if (view && conf.regex.view.test(view)) {
        viewer.changeView(view);
      } else {
        viewer.changeView('default');
      }

      // set tags
      if (Story.NODES.TYPES.MEDIA.includes(data.selectedEntityType) ||
          data.selectedEntityType == Story.NODES.TYPES.TAG) {
        viewer.cones.clear();
      }
      var tags = viewer.story.getTags(data.selectedEntityId);
      console.log('TAGS:', tags);
      tags.forEach(function(tag) {
        console.log(tag);
        if (tag.position && conf.regex.tag.test(tag.position)) {
          viewer.cones.createFromMeta(tag);
        }
      });

      if (viewer.story.getNodeType(data.selectedEntityId) == Story.NODES.TYPES.TAG) {
        viewer.tagInFocus = data.selectedEntityId;
        $('#curr_tag_button').prop('disabled',false);
      } else {
        $('#curr_tag_button').prop('disabled',true);
        viewer.tagInFocus = null;
      }

      if (viewer.story.getNodeType(data.selectedEntityId) == Story.NODES.TYPES.VIEW) {
        viewer.viewInFocus = data.selectedEntityId;
        $('#curr_view_button').prop('disabled',false);
      } else {
        $('#curr_view_button').prop('disabled',true);
        viewer.viewInFocus = null;
      }
    }
    break;
  }
};

/**
 * Creates the story of the pure yjs data
 * @param {obj} story - yjs representation of the story graph
 */
viewer.initStory = function (story) {
  viewer.story = new Story(story);
};

/**
 * Callback when story graph changed
 */
viewer.storyChanged = function (events) {
  viewer.story.update(window.y.share.data.get('model'));
};

/**
 * Tells x3dom the new object id, leading to the URL to load it from
 */
viewer.loadModel = function (id) {
  var model = conf.external.OBJECT_ROOT+id+'.x3d';
  console.log('loading model from: '+model);
  viewer.inline.attr('url', model);
};

/**
 * Event handler for when the model is fully loaded
 */
viewer.onModelLoaded = function () {
  viewer.toStdView();
//  viewer.changeView(viewer.calcCam());
//  viewer.elem[0].runtime.addEventListener("transitionend", viewer.test, false);
};

/**
 * Resets the camera to the default front view
 */
viewer.toStdView = function () {
  viewer.elem[0].runtime.showAll();
};

/**
 * Puts content of text field into clipboard
 */
viewer.toClipboard = function () {
  if (viewer.tagMode && viewer.tagInFocus) {
    viewer.iwcClient.
      clearAttr(viewer.tagInFocus,
                Story.NODES.MEDIA.TAG_POSITION,
                viewer.story.getNodeAttributes(viewer.tagInFocus)
                [Story.NODES.MEDIA.TAG_POSITION].length);
    viewer.iwcClient.sendAttr(viewer.tagInFocus, Story.NODES.MEDIA.TAG_POSITION, viewer.buffer);
    return true;
  } else if (!viewer.tagMode && viewer.viewInFocus) {
    viewer.iwcClient.
      clearAttr(viewer.viewInFocus,
                Story.NODES.MEDIA.SETTING,
                viewer.story.getNodeAttributes(viewer.viewInFocus)
                [Story.NODES.MEDIA.SETTING].length);
    viewer.iwcClient.sendAttr(viewer.viewInFocus, Story.NODES.MEDIA.SETTING, viewer.lastView);
    return true;
  } else {
    return false;
  }
};
viewer.toClipboard_ = function (type) {
//  $('#curr_'+type).attr('value', text);
  $('#curr_'+type)[0].select();
  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('copying text command was ' + msg);
    return true;
  } catch (err) {
    console.log('unable to copy');
    return false;
  }
};

/**
 * Converts the current camera into the x3dom string
 */
viewer.calcCam = function () {
  var mat_view = viewer.elem[0].runtime.viewMatrix().inverse();
  var cor = viewer.elem[0].runtime.canvas.doc._scene.getViewpoint().getCenterOfRotation();
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
viewer.clipboardButton = function (type) {
  if (viewer.toClipboard(type)) {
    toast_cp.open();
  } else {
    toast_cp_fail.open();
  }
};


/**
 * Start making tags
 */
viewer.enterTagMode = function () {
  viewer.tagMode = true;
  viewer.setNavigation(false);
//  $('#tagmode').prop('disabled', true);
//  $('#div_mode').html('Tag:');
  $('#curr_tag').attr('value', 'Click somewhere');
};

/**
 * Stop making tags
 */
viewer.leaveTagMode = function () {
  viewer.tagMode = false;
  viewer.setNavigation(true);
 // $('#tagmode').prop('disabled', false);
 // $('#div_mode').html('View:');
 // viewer.cones.undoLastCone();
};

/**
 * Turn navigation on or off
 * @param {bool} state
 */
viewer.setNavigation = function (state) {
  $('#navType').attr('type', state ? '"any"' : '"none"');
};

/**
 * Event handler for clicks on the model.
 * @param {event} event 
 */
viewer.handleClick = function (event) {
  if (!viewer.tagMode) {
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
  
  $('#curr_tag').attr('value', text);
  viewer.buffer = text;
//  $('#curr_tag')[0].select();
  viewer.cones.deleteConesByUser(viewer.TAGS.TEMP);
  viewer.cones.generateCone(viewer.TAGS.TEMP, pos_text, dir_text);
};

/**
 * Callback for when a tag is clicked
 * @param {int} id - id of the tag clicked
 */
viewer.handleTagClick = function (id) {
  var nodeId = viewer.cones.cones[id].nodeId;
  var attrs = viewer.story.getNodeAttributes(nodeId);
  viewer.iwcClient.sendSelectNode(nodeId, viewer.story.getNodeType(nodeId));  
  $('#tag_header').text(attrs[Story.NODES.MEDIA.TAG_NAME]);
  $('#tag_text').text(attrs[Story.NODES.MEDIA.TAG_DESCRIPTION]);
  $('#tag_dialog')[0].open();
};

viewer.lastView = "";
/**
 * Callback for when the camera is moved
 */
viewer.handleOrientation = function () {
  var str = viewer.calcCam();
  // avoid redundant textbox updates. still fails sometimes though (chrome only)
  if (str !== viewer.lastView) {
    viewer.lastView = str;
    $('#curr_view').attr('value', str);
  }
};


viewer.lastViewSet = null;

viewer.currIndex = 0;
viewer.ring = [];
/**
 * Moves the camera to a specific point and angle
 * @param {string} view - position="x y z" orientation="x y z t"
 */
viewer.changeView = function (view) {

  console.log('VIEW IS', view);
  if (view == 'default') {
    viewer.toStdView();
  } else {
    var id = 'view_'+viewer.currIndex;
    var existing = viewer.scene.find('#'+id);
    if (existing.length !== 0) {
      existing.remove();
    }
    viewer.scene.append(
      '<Viewpoint id="'+id+'" '+view+' description="camera" set_bind="true"></Viewpoint>'
    );
    viewer.scene.find('#'+id).attr('set_bind', 'true');
    viewer.currIndex = (viewer.currIndex+1) % 3;
  }

  viewer.lastViewSet = view;
};

/**
 * Moves the camera to the last view that has been explicitly set
 */
viewer.toLastView = function () {
  viewer.changeView(viewer.lastViewSet || viewer.calcCam());
};

/**
 * Manages the tags (cones) on an object
 */
viewer.cones = {};

viewer.cones.lastCone = null;

viewer.cones.cones = {};

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
viewer.cones.generateCone = function (author, pos, dir, color, size, transparency) {
  var cone = new viewer.cones.cone(author, pos, dir, color, size, transparency);
  if (!this.cones.hasOwnProperty(cone.getId())) {
    cone.appendToScene(viewer.scene);
    this.lastCone = cone.getId();
    this.cones[cone.getId()] = cone;
    return cone;
  } else {
    return this.cones[cone.getId()];
  }
};

viewer.cones.createFromMeta = function (data) {
  var info = data.position.split('"');
  var cone = this.generateCone(null, info[1], info[3]);
  cone.nodeId = data.nodeId;
};

/**
 * Remove the previously added cone
 */
viewer.cones.deleteConesByUser = function (user) {  
  for (var id in this.cones) {
    if (!this.cones.hasOwnProperty(id)) {
      continue;
    }

    if (this.cones[id].author == viewer.TAGS.TEMP) {
      this.deleteCone(id);      
    }
  }
};

/**
 * Removes a cone
 * @param {string} id
 */
viewer.cones.deleteCone = function (id) {
  this.cones[id].removeFromScene();
  delete this.cones[id];
};

/**
 * Removes all cones
 */
viewer.cones.clear = function () {
  for (var id in this.cones) {
    if (!this.cones.hasOwnProperty(id)) {
      continue;
    }

    this.deleteCone(id);
  }
};

/**
 * Cone constructor
 * @param {string} pos - Position in "x y z"
 * @param {string} dir - Surface normal in "x y z"
 * @param {string} color - Color in "r g b"
 * @param {float} size - Size
 * @param {float} transparency - Transparency
 */
viewer.cones.cone = function (author, pos, dir, color, size, transparency) {
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
  var html =
      "<transform id='" + tag + "' translation='" + pos + "' center='0 1 0' scale ='"+size+' '+size*2+' '+size+"' rotation='"+dirvec.toString()+" "+Math.PI+"'>" +
      "<shape onclick='viewer.handleTagClick("+id+");'>" +
      "<appearance>" +
      "<material diffuseColor='" + color + "' transparency='0.5'></material>" +
      "</appearance>" +
      "<cone></cone>" +
      "</shape>" +
      "</transform>";

  this.id = id;
  this.tag = tag;
  this.html = html;
  this.author = author;
};

/**
 * Returns the id
 */
viewer.cones.cone.prototype.getId = function () {
  return this.id;
};

/**
 * Appends the cones' html to the scene
  * @param {element} scene - jQuery element of the scene
 */
viewer.cones.cone.prototype.appendToScene = function (scene) {
  scene.append(this.html);
  this.scene = scene;
};

/**
 * Removes cone from the scene to which it was added to
 */
viewer.cones.cone.prototype.removeFromScene = function () {
  this.scene.find('#'+this.tag).remove();
};
