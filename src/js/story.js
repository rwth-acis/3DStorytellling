var Story = function (story) {

  this.data = story;
  this.state = this.getEntryNode();

  this.start = this.state;
}

Story.EDGES = {
  TYPES : {
    TRANSITION : "Story Transition",
    BME_SU : "BME -> SU",
    SU_BME : "BME split",
    BME_MEDIA : "Media Connection"
  },
  NAME : "Name"
};

Story.NODES = {
  TYPES : {
    VIDEO : "Video",
    TEXT : "Text",
    IMAGE : "Image",
    MEDIA : ["Video", "Text", "Image"],
    //
    BEGIN : "Begin",
    MIDDLE : "Middle",
    END : "End",
    SU : "Story Unit",
    //
    VIEW : "3D View"
  },
  TITLE : "Title",
  CAPTION : "Caption",
  MEDIA : {
    TEXT : "Text",
    IMAGE : "URL",
    VIDEO : "URL",
    SETTING : "Setting"
  }
};

Story.prototype.update = function (data) {
  this.data = data;
};

Story.prototype.setState = function (id) {
  this.state = id;
};

Story.prototype.getState = function () {
  return this.state;
};

Story.prototype.getStart = function () {
  return this.start;
};

Story.prototype.getNodeAttributes = function (id) {
  return this.getAttributes(this.data.nodes[id].attributes);
};

Story.prototype.getAttributes = function (attr) {
  if (!attr) {
    return {};
  }
  var res = {};
  
  for (var attrId in attr) {
    if (!attr.hasOwnProperty(attrId)) {
      continue;
    }
    var curr = attr[attrId];
    res[curr.name] = attr[attrId].value.value;    
  }

  return res;
};

Story.prototype.getNodeType = function (id) {
  return this.data.nodes[id].type;
};

Story.prototype.getEdgeType = function (id) {
  return this.data.edges[id].type;
};

Story.prototype.getAdjacentEdges = function (id) {
  var res = {};

  for (var edgeId in this.data.edges) {
    if (!this.data.edges.hasOwnProperty(edgeId)) {
      continue;
    }
    var curr = this.data.edges[edgeId];
    if (curr.source == id || curr.target == id) {
      // instead of storing the adjacent edges as (source,taget), we simply
      // store the target, and the direction, in which the edge points.
      // '1': pointing away; '-1': pointing towards
      var dir = curr.source == id ? 1 : -1;
      res[edgeId] = {
        dir : dir,
        target : dir === 1 ? curr.target : curr.source,
        type : curr.type,
        attributes : this.getAttributes(curr.attributes)
      };
    }
  }

  return res;
};

Story.prototype.getView = function (id) {
  var adj = this.getAdjacentEdges(id);
  for (var edgeId in adj) {
    if (!adj.hasOwnProperty(edgeId)) {
      continue;
    }

    var curr = adj[edgeId].target;
    if (this.getNodeType(curr) == Story.NODES.TYPES.VIEW) {
      return this.getNodeAttributes(curr)[Story.NODES.MEDIA.SETTING];
    }
  }

  return null;
};

Story.prototype.getStoryTransitions = function (id) {
  var edges = this.getAdjacentEdges(id);
  var res = {};
  
  for (var edgeId in edges) {
    if (!edges.hasOwnProperty(edgeId)) {
      continue;
    }

    var curr = edges[edgeId];
    if (curr.type == Story.EDGES.TYPES.TRANSITION && curr.dir === 1) {
      res[edgeId] = {
        target : curr.target,
        name : curr.attributes[Story.EDGES.NAME]
      }
    }
  }

  return res;
};

Story.prototype.getRoot = function () {
  for (var nodeId in this.data.nodes) {
    if (!this.data.nodes.hasOwnProperty(nodeId)) {
      continue;
    }
    var is = true;
    var neighbors = this.getAdjacentEdges(nodeId);
    for (var edgeId in neighbors) {
      if (!neighbors.hasOwnProperty("edge")) {
        continue;
      }
      
      if (this.getEdgeType(edgeId) == Story.EDGES.TYPES.BME_SU) {
        is = false;
        break;
      }
    }
    if (is) {
      return nodeId;
    } else {
      return null;
    }
  }
};

/**
 * Returns the earliest (in terms of story progression) media node in the subtree
 * @param {string} id - the id of the node to start at
 * @return {string} 
 */
Story.prototype.fall = function (id) {
  // to prevent loops
  var visited = [];
  var i = 0;
  while (!Story.NODES.TYPES.MEDIA.includes(this.getNodeType(id)) && !visited.includes(id)) {
    visited.push(id);
    var nodeType = this.getNodeType(id);
    var adj = this.getAdjacentEdges(id);
    for (var edgeId in adj) {
      if (!adj.hasOwnProperty(edgeId)) {
        continue;
      }
      
      var edgeType = this.getEdgeType(edgeId);
      if (adj[edgeId].dir === 1 && (
        this.getNodeType(adj[edgeId].target) == Story.NODES.TYPES.BEGIN ||
          (nodeType == Story.NODES.TYPES.BEGIN && [Story.EDGES.TYPES.BME_SU, Story.EDGES.TYPES.BME_MEDIA].includes(edgeType))
      )) {
        id = adj[edgeId].target;
      }
    }
  }

  return id;
};

Story.prototype.getName = function () {
  return this.getNodeAttributes(this.getRoot())[Story.NODES.TITLE];
};

Story.prototype.getEntryNode = function () {
  var root = this.getRoot();
  if (!root) {
    return null;
  }
  return this.fall(root);
};
