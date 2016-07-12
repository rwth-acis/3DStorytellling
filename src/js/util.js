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
  }
};
