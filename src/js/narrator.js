var narrator = {};

narrator.story;

narrator.storyReady = false;

narrator.path = new Array();

narrator.iwcClient;

narrator.init = function () {
  var me = this;

  // pretend to be the attribute widget, in order to receive the canvas' messages
  me.iwcClient = new Las2peerWidgetLibrary(conf.external.LAS, me.iwcCallback, "ATTRIBUTE");

  yjsSync().done(function(y) {

    function initY () {
      window.y = y;
      console.info('Story Viewer: Yjs successfully initialized');
      narrator.initStory(y.share.data.get('model'));
      y.share.data.observe(narrator.storyChanged);
    }
    initY();
    
  }).fail(function(){
    window.y= undefined;
    console.log('Story Viewer: Yjs initialization failed');
  });
  
};

narrator.iwcCallback = function (intent) {
  console.log("NARRATOR RECEIVED", intent);
  switch (intent.action) {
  case conf.intents.syncmeta:
    var payload = intent.extras.payload.data;
    if (payload.type == conf.operations.entitySelect) {
      var data = JSON.parse(payload.data);
      var id = data.selectedEntityId;
      if (Story.NODES.TYPES.MEDIA.includes(narrator.story.getNodeType(id))) {
        narrator.display(id, true);
      }
    }
    break;
  }
};

narrator.iwcEmit = function (type, data) {
  if (this.iwcClient) {
    this.iwcClient.sendIntent(type, data, false);
  }
};

narrator.initStory = function (story) {
  this.story = new Story(story);
  narrator.refresh();
};

narrator.bindStory = function () {
  $('#story_title').html(me.story.getName());
  if (window.story_state) {
    me.display(window.story_state);
  } else {
    me.display(me.story.getState());
    window.story_state = me.story.getState();
  }
  narrator.storyReady = true;
};

narrator.storyChanged = function (events) {
  $('#refresh_button').removeAttr('disabled');
};

narrator.refresh = function () {
  narrator.story.update(window.y.share.data.get('model'));
  if (narrator.story.isEmpty()) {
    narrator.showTutorial();
  } else if (!narrator.story.getState()) {
    var entry = narrator.story.getEntryNode();
    if (entry) {
      narrator.story.setState(entry);
      narrator.story.setStart(entry);
      narrator.display(narrator.story.getState());
    } else {
      narrator.showNoBegin();
    }
  } else {
    narrator.display(narrator.story.getState());
  }

  $('#refresh_button').attr('disabled','');
};

narrator.showTutorial = function () {
  console.log(conf.external);
  narrator.embedImage($('#card_media'), conf.external.ROOT+'img/tut.jpg');
  $('#card_caption').text(lang.TUTORIAL);
};

narrator.showNoBegin = function () {
  $('#card_caption').text(lang.NO_BEGIN);
};

narrator.goTo = function (id) {
  this.path.push(this.story.getState());
  this.display(id);
  $('#undo_button').removeAttr('disabled');
};

narrator.undo = function () {
  this.display(this.path.pop());
  if (this.path.length === 0) {
    $('#undo_button').attr('disabled','');
  }
};

narrator.display = function (id, hide) {
  if (!hide) {
    this.iwcEmit(conf.intents.story_currentNode, id);
  }
  this.story.setState(id);
  var next = this.story.getStoryTransitions(id);
  var num = 0;
  var one = "";
  for (var edgeId in next) {
    if (!next.hasOwnProperty(edgeId)) {
      continue;
    }
    
    num++;
    one = edgeId;
    if (next[edgeId].name == "") {
      next[edgeId].name = this.story.getNodeAttributes(next[edgeId].target)[Story.NODES.TITLE];
    }
  }
  if (num == 1 && next[one].name == this.story.getNodeAttributes(next[one].target)[Story.NODES.TITLE]) {
    next[one].name = "next";
  }
  
  var curr = this.story.getNodeAttributes(id);

  $('#card_title').text(curr[Story.NODES.TITLE]);

  $('#card_media').html('');
  var mediaElem = $('#card_media');
  switch (this.story.getNodeType(id)) {
  case Story.NODES.TYPES.TEXT:
    this.embedText(mediaElem, this.story.getNodeAttributes(id)[Story.NODES.MEDIA.TEXT]);
    break;
  case Story.NODES.TYPES.IMAGE:
    this.embedImage(mediaElem, this.story.getNodeAttributes(id)[Story.NODES.MEDIA.IMAGE]);
    break;
  case Story.NODES.TYPES.VIDEO:
    this.embedVideo(mediaElem, this.story.getNodeAttributes(id)[Story.NODES.MEDIA.VIDEO]);
    break;    
  }
  
  $('#card_caption').text(curr[Story.NODES.CAPTION]);

  $('#card_links').html('');
  for (var edgeId in next) {
    if (!next.hasOwnProperty(edgeId)) {
      continue;
    }

    var button = document.createElement('paper-button');
    var target = next[edgeId].target;
    button.setAttribute('onclick', 'window.setTimeout(function(){narrator.goTo("'+target+'")},200);');
    Polymer.dom(button).textContent = next[edgeId].name;
    $('#card_links').append(button);
  }
  
  $('#cont').animate({ scrollTop: (0) }, 'slow');
};

narrator.embedText = function (elem, cont) {
  elem.text(cont);
};

narrator.embedImage = function (elem, cont) {
  elem.html('<img style="width:100%; height:auto;" src="'+cont+'">');
};

narrator.embedVideo = function (elem, cont) {
  if (/((https:\/\/)?youtu\.be\/.*)|((https:\/\/)?www\.)?youtube\..*\/watch\?v=.*/.test(cont)) {
    var split = cont.split('.be/');
    split = split[split.length-1].split('?v=');
    split = split[split.length-1].split('&t=');
    var video = document.createElement('google-youtube');
    video.setAttribute('video-id', split[0]);
    video.setAttribute('fluid', "true");
    video.setAttribute('rel', "0");
    video.setAttribute('width', "100%");
    elem.append(video);
  }
};
