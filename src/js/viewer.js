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

viewer.init = function (model) {
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

viewer.iwcCallback = function (intent) {
  console.log("VIEWER RECEIVED", intent);
  switch (intent.action) {
  case conf.intents.story_currentNode:
    // parse and set view
    var view = viewer.story.getView(intent.data);
    if (view && conf.regex.view.test(view)) {
      viewer.changeView(view);
    }

    // set tags
    viewer.cones.clear();
    var tags = viewer.story.getTags(intent.data);
    tags.forEach(function(tag) {
      if (tag.position && conf.regex.tag.test(tag.position)) {
        viewer.cones.createFromMeta(tag);
      }
    });
    break;
  case conf.intents.syncmeta:
    var payload = intent.extras.payload.data;
    if (payload.type == conf.operations.entitySelect) {
      var data = JSON.parse(payload.data);
      var view = viewer.story.getView(data.selectedEntityId);
      if (view && conf.regex.view.test(view)) {
        viewer.changeView(view);
      }
    }
    break;
  }
};

viewer.initStory = function (story) {
  viewer.story = new Story(story);
};

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
  viewer.changeView(viewer.calcCam());
  viewer.elem[0].runtime.addEventListener("viewpointChanged", function(e){console.log(e.position);}, false);
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
viewer.toClipboard = function (type) {
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
    +'centerOfRotation"'
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
//  $('#curr_tag')[0].select();
  viewer.cones.deleteConesByUser(viewer.TAGS.TEMP);
  viewer.cones.generateCone(viewer.TAGS.TEMP, pos_text, dir_text);
};

viewer.handleTagClick = function (id) {
  var attrs = viewer.story.getNodeAttributes(viewer.cones.cones[id].nodeId);
  $('#tag_header').text(attrs[Story.NODES.MEDIA.TAG_NAME]);
  $('#tag_text').text(attrs[Story.NODES.MEDIA.TAG_DESCRIPTION]);
  $('#tag_dialog')[0].open();
};

viewer.lastView = "";
viewer.handleOrientation = function () {
  var str = viewer.calcCam();
  if (str !== viewer.lastView) {
    viewer.lastView = str;
    $('#curr_view').attr('value', str);
  }
};

/**
 * Moves the camera to a specific point and angle
 * @param {string} view - position="x y z" orientation="x y z t"
 */
viewer.changeView = function (view) {
  var id = 'view_'+util.hashString(view);
  var existing = viewer.scene.find('#'+id);
  if (existing.length !== 0) {
    existing.attr('set_bind', 'true');
  } else {
    viewer.scene.append(
      '<Viewpoint id="'+id+'" '+view+' description="camera"></Viewpoint>'
    );
    viewer.changeView(view);
  }
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
  cone.appendToScene(viewer.scene);
  this.lastCone = cone.getId();
  this.cones[cone.getId()] = cone;
  return cone;
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
