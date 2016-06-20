var narrator = {};

narrator.story;

narrator.path = new Array();

narrator.init = function () {
  var me = this;
  
  yjsSync().done(function(y) {
    window.y = y;
    console.info('Story Viewer: Yjs successfully initialized');
    narrator.initStory(y.share.data.get('model'));
    y.share.data.observe(narrator.refreshStory);

    me.display(me.story.getState());
    $('#story_title').html(me.story.getName());
  }).fail(function(){
    window.y= undefined;
    console.log('Story Viewer: Yjs initialization failed');
  });
  
};

narrator.initStory = function (story) {
  this.story = new Story(story);
};

narrator.refreshStory = function () {
  narrator.story.update(window.y.share.data.get('model'));
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

narrator.display = function (id) {
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
