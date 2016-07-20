util = {
  hashString : function (string) {
    var hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
      cha = string.charCodeAt(i);
      hash = ((hash<<5)-hash)+cha;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },
  containsAll : function (a, b) {
    for (var i = 0; i < b.length; i++) {
      if (!a.includes(b[i])) {
        return false;
      }
    }
    return true;
  },
  /**
   * places a text into an arbitrary dom-element (use the card_media)
   * @param {dom} elem 
   * @param {string} cont
   */
  embedText : function (elem, cont) {
    elem.text(cont);
  },

  /**
   * embeds an image inside an arbitrary dom-element (use the card_media)
   * @param {dom} elem 
   * @param {string} url
   */
  embedImage : function (elem, url) {
    if (url) {
      elem.html('<a href="'+url+'" target="_blank"><div style="width:400px; height:300px; background-size:contain; background-image:url(\''+url+'\'); background-repeat:no-repeat;"></div><a>');
    }
  },

  /**
   * embeds a video inside an arbitrary dom-element (use the card_media)
   * @param {dom} elem 
   * @param {string} url - Only youtube links supported atm
   */
  embedVideo : function (elem, url) {
    if (conf.regex.video.test(url)) {
      var split = url.split('.be/');
      split = split[split.length-1].split('?v=');
      split = split[split.length-1].split('&t=');
      var video = document.createElement('google-youtube');
      video.setAttribute('video-id', split[0]);
      video.setAttribute('fluid', "true");
      video.setAttribute('rel', "0");
      video.setAttribute('width', "100%");
      elem.append(video);
    }
  },

  /**
   * embeds a video inside an arbitrary dom-element (use the card_media)
   * @param {dom} elem 
   * @param {string} url - Only youtube links supported atm
   */
  embedAudio : function (elem, url) {
    elem.html('<audio src="'+url+'" controls style="width:100%"></audio>');
  }
};
