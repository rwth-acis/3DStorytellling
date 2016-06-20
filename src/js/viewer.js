var viewer = {};
// The x3dom element (jQuery)
viewer.elem;

// The x3dom inline to load the object (jQuery)
viewer.inline;

// The x3dom scene element (jQuery)
viewer.scene;

viewer.tagMode = false;

viewer.iwcClient;

viewer.init = function (model) {
  var me = this;

  $(function () {
    me.elem = $('#elem');
    me.inline = $('#inline');
    me.scene = $('#scene');
    me.elem[0].addEventListener("mousemove", me.handleOrientation, true);
    me.loadModel(model);

    me.iwcClient = new Las2peerWidgetLibrary(window.location.href, viewer.iwcCallbackFunction);
    
  });

  yjsSync().done(function(y){
    window.y = y;
    console.info('3D Object Viewer: Yjs successfully initialized');
    var model = y.share.data.get('model');
    console.log(model);
    y.share.data.observe(function () {
      console.log("blablubb");
    });
  }).fail(function(){
    window.y= undefined;
    console.log('3D Object Viewer: Yjs initialization failed');
  });
};

viewer.iwcCallbackFunction = function (intent) {
  console.log("OBJECT VIEWER RECEIVED INTENT", intent);
};

/**
 * Tells x3dom the new object id, leading to the URL to load it from
 */
viewer.loadModel = function (id) {
  var model = conf.external.OBJECT_ROOT+id+'.x3d';
  console.log('loading model from: '+model);
  this.inline.attr('url', model);
};

/**
 * Event handler for when the model is fully loaded
 */
viewer.onModelLoaded = function () {
  this.toStdView();
  this.elem[0].runtime.addEventListener("viewpointChanged", function(e){console.log(e.position);}, false);
};

/**
 * Resets the camera to the default front view
 */
viewer.toStdView = function () {
  this.elem[0].runtime.showAll();
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
  var mat_view = this.elem[0].runtime.viewMatrix().inverse();
  var rotation = new x3dom.fields.Quaternion(0,0,1,0);
  rotation.setValue(mat_view);
  var rot=rotation.toAxisAngle();
  var translation=mat_view.e3();
  var text =
     'position="'
      +translation.x.toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+' '
      +translation.y.toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+' '
      +translation.z.toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+'" '
    +'orientation="'+rot[0].x.toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+' '
      +rot[0].y.toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+' '
      +rot[0].z.toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+' '
      +rot[1].toFixed(conf.viewer.CAM_OUTPUT_PRECISION)+'"';
  return text;
};

/**
 * Event handler for 'add to clipboard' buttons
 */
viewer.clipboardButton = function (type) {
  if (this.toClipboard(type)) {
    toast_cp.open();
  } else {
    toast_cp_fail.open();
  }
};


/**
 * Start making tags
 */
viewer.enterTagMode = function () {
  this.tagMode = true;
  this.setNavigation(false);
//  $('#tagmode').prop('disabled', true);
//  $('#div_mode').html('Tag:');
  $('#curr_tag').attr('value', 'Click somewhere');
};

/**
 * Stop making tags
 */
viewer.leaveTagMode = function () {
  this.tagMode = false;
  this.setNavigation(true);
 // $('#tagmode').prop('disabled', false);
 // $('#div_mode').html('View:');
 // this.cones.undoLastCone();
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
  if (!this.tagMode) {
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
      'position="'+pos_text+'"'+
      'orientation="'+dir_text+'"';
  
  $('#curr_tag').attr('value', text);
//  $('#curr_tag')[0].select();
  this.cones.undoLastCone();
  this.cones.generateCone(pos_text, dir_text);
};

viewer.handleOrientation = function () {
  $('#curr_view').attr('value', viewer.calcCam());
};

/**
 * Moves the camera to a specific point and angle
 * @param {string} view - position="x y z" orientation="x y z t"
 */
viewer.changeView = function (view) {
  var id = 'view_'+util.hashString(view);
  var existing = this.scene.find('#'+id);
  if (existing) {
    existing.attr('set_bind', 'true');
  } else {
    this.scene.append(
      '<Viewpoint id="'+id+'" '+view+' description="camera" set_bind="true"'
    );
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
 * @param {string} pos - Position in "x y z"
 * @param {string} dir - Surface normal in "x y z"
 * @param {string} color - Color in "r g b"
 * @param {float} size - Size
 * @param {float} transparency - Transparency
 */
viewer.cones.generateCone = function (pos, dir, color, size, transparency) {
  var cone = new viewer.cones.cone(pos, dir, color, size, transparency);
  cone.appendToScene(viewer.scene);
  this.lastCone = cone.getId();
  this.cones[cone.getId()] = cone;
  return res;
};

/**
 * Remove the previously added cone
 */
viewer.cones.undoLastCone = function () {
  if (this.lastCone != null) {
    this.deleteCone(this.lastCone);
    this.lastCone = null;
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
viewer.cones.cone = function (pos, dir, color, size, transparency) {
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
    "<shape>" +
        "<appearance>" +
      "<material diffuseColor='" + color + "' transparency='0.5'></material>" +
        "</appearance>" +
        "<cone></cone>" +
    "</shape>" +
    "</transform>";

  this.id = id;
  this.tag = tag;
  this.html = html;
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
