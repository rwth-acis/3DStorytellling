var Story = function (story) {

  this.data = story;
  this.state = this.getEntryNode();

  this.start = this.state;

  this.visited = [];
}

Story.EDGES = {
  TYPES : {
    TRANSITION : "Story Transition",
    BME_SU : "Story Unit Connection",
    SU_BME : "BME split",
    BME_MEDIA : "Media Connection",
    REQUIREMENT : "Requirement"
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
    VIEW : "3D View",
    TAG : "3D Tag"
  },
  TITLE : "Title",
  CAPTION : "Caption",
  MEDIA : {
    TEXT : "Text",
    IMAGE : "URL",
    VIDEO : "URL",
    SETTING : "meta",
    TAG_POSITION : "meta",
    TAG_NAME : "Title",
    TAG_DESCRIPTION : "Description",
    TAG_COLOR : "Color",
    TRANSITION_TAG : "Tag"
  }
};

/**
 * @param {obj} data - yjs story graph from syncmeta
 */
Story.prototype.update = function (data) {
  this.data = data;
};

/**
 * Sets the state of the story _and_ saves it to the history
 * @param {int} id
 */
Story.prototype.setState = function (id) {
  this.state = id;
  this.visited.push(id);
};

/**
 * @return {int} 
 */
Story.prototype.getState = function () {
  return this.state;
};

/**
 * Defines the story's entry node
 * @param {int} start 
 */
Story.prototype.setStart = function (start) {
  this.start = start;
};

/**
 * @return {int} 
 */
Story.prototype.getStart = function () {
  return this.start;
};

/**
 * Returns the attributes (for nodes)
 * @param {int} id 
 * @return {obj} 
 */
Story.prototype.getNodeAttributes = function (id) {
  return this.getAttributes(this.data.nodes[id].attributes);
};

/**
 * Returns the attributes (for any entity)
 * @param {int} id 
 * @return {obj} 
 */
Story.prototype.getAnyAttributes = function (id) {
  if (this.isNode(id)) {
    return this.getAttributes(this.data.nodes[id].attributes);
  } else {
    return this.getAttributes(this.data.edges[id].attributes);
  }
};

/**
 * Filters the relevant attributes from the yjs reprentation
 * @param {obj} attr - yjs node
 * @return {obj} 
 */
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

/**
 * @return {bool} true, if there is no graph or it is empty
 */
Story.prototype.isEmpty = function () {
  if (!this.data) {
    return true;
  } else {
    return $.isEmptyObject(this.data.nodes);
  }
};

/**
 * @return {string} 
 */
Story.prototype.getNodeType = function (id) {
  return this.data.nodes[id].type;
};

/**
 * @return {string} 
 */
Story.prototype.getEdgeType = function (id) {
  return this.data.edges[id].type;
};

/**
 * @return {string} 
 */
Story.prototype.getEntityType = function (id) {
  if (this.data.nodes.hasOwnProperty(id)) {
    return this.getNodeType(id);
  } else if (this.data.edges.hasOwnProperty(id)) {
    return this.getEdgeType(id);
  }
};

/**
 * @return {bool} 
 */
Story.prototype.isNode = function (id) {
  return this.data.nodes.hasOwnProperty(id);
};

/**
 * @param {int} id 
 * @return {{dir:'1/-1, if edge points away/twoards',target:int,type:string,attributes:obj}}
 */
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

/**
 * @param {int} id 
 * @return {string|null} null, if the node does not have one
 */
Story.prototype.getView = function (id) {
  if (this.getNodeType(id) == Story.NODES.TYPES.VIEW) {
    return this.getNodeAttributes(id)[Story.NODES.MEDIA.SETTING];
  }
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

/**
 * @param {int} id 
 * @return {[string]} 
 */
Story.prototype.getTags = function (id) {
  if (this.getNodeType(id) == Story.NODES.TYPES.TAG) {
    var attr = this.getNodeAttributes(id);
    return [{
      title : attr[Story.NODES.MEDIA.TAG_NAME],
      position : attr[Story.NODES.MEDIA.TAG_POSITION],
      description : attr[Story.NODES.MEDIA.TAG_DESCRIPTION],
      color : attr[Story.NODES.MEDIA.TAG_COLOR],
      nodeId : id
    }];
  }
  var adj = this.getAdjacentEdges(id);
  var res = [];
  for (var edgeId in adj) {
    if (!adj.hasOwnProperty(edgeId)) {
      continue;
    }

    var curr = adj[edgeId].target;
    if (this.getNodeType(curr) == Story.NODES.TYPES.TAG) {
      var attr = this.getNodeAttributes(curr);
      res.push({
        title : attr[Story.NODES.MEDIA.TAG_NAME],
        position : attr[Story.NODES.MEDIA.TAG_POSITION],
        description : attr[Story.NODES.MEDIA.TAG_DESCRIPTION],
        color : attr[Story.NODES.MEDIA.TAG_COLOR],
        nodeId : curr
      }); 
    }
  }

  return res;
};

/**
 * @param {int} id
 * @param {bool} mask - only return next steps that filfill the requirements
  * @return {obj} {int:{target:int,name:string}}
 */
Story.prototype.getStoryTransitions = function (id, mask) {
  var edges = this.getAdjacentEdges(id);
  var res = {};
  
  for (var edgeId in edges) {
    if (!edges.hasOwnProperty(edgeId)) {
      continue;
    }

    var curr = edges[edgeId];
    if (curr.type == Story.EDGES.TYPES.TRANSITION && curr.dir === 1) {
      if (mask) {
        var reqs = this.getRequirements(curr.target);
        if (!util.containsAll(this.visited, reqs)) {
          continue;
        }
      }

      res[edgeId] = {
        target : curr.target,
        name : curr.attributes[Story.EDGES.NAME],
        tag : curr.attributes[Story.NODES.MEDIA.TRANSITION_TAG]
      }
    }
  }

  return res;
};

/**
 * The nodes that have to be alredy visited in order to visit {{id}}
 * @param {int} id
 * @return {[int]} 
 */
Story.prototype.getRequirements = function (id) {
  var edges = this.getAdjacentEdges(id);
  var res = [];
  
  for (var edgeId in edges) {
    if (!edges.hasOwnProperty(edgeId)) {
      continue;
    }

    var curr = edges[edgeId];
    if (curr.type == Story.EDGES.TYPES.REQUIREMENT && curr.dir === 1) {
      res.push(curr.target);
    }
  }

  return res;
};

/**
    * @return {int} root node of the story graph (NOT the start of the story!)
 */
Story.prototype.getRoot = function () {
  if (!this.data) {
    return null;
  }
  for (var nodeId in this.data.nodes) {
    if (!this.data.nodes.hasOwnProperty(nodeId) ||
        this.getNodeType(nodeId) != Story.NODES.TYPES.SU) {
      continue;
    }
    var is = true;
    var neighbors = this.getAdjacentEdges(nodeId);
    for (var edgeId in neighbors) {
      if (!neighbors.hasOwnProperty(edgeId)) {
        continue;
      }
      
      if (this.getEdgeType(edgeId) == Story.EDGES.TYPES.BME_SU) {
        is = false;
        break;
      }
    }
    if (is) {
      return nodeId;
    }
  }
  return null;
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

  if (Story.NODES.TYPES.MEDIA.includes(this.getNodeType(id))) {
    return id;
  } else {
    return null;
  } 
};

/**
 * @return {string} the name of the story
 */
Story.prototype.getName = function () {
  var root = this.getRoot();
  if (!root) {
    return null;
  }
  return this.getNodeAttributes(root)[Story.NODES.TITLE];
};

/**
 * @return {string|null} first node of the story, or null if there is none
 */
Story.prototype.getEntryNode = function () {
  var root = this.getRoot();
  if (!root) {
    return null;
  }
  return this.fall(root);
};
