var story = function () {

  this.data = story.mockup;
  this.state = this.getEntryNode();
}

story.EDGES = {
  TYPES : {
    TRANSITION : "Story Transition",
    BME_SU : "BME -> SU",
    SU_BME : "BME split",
    BME_MEDIA : "Media Connection"
  },
  NAME : "Name"
};

story.NODES = {
  TYPES : {
    VIDEO : "Video",
    TEXT : "Text",
    IMAGE : "Image",
    MEDIA : ["Video", "Text", "Image"],
    //
    BEGIN : "Begin",
    MIDDLE : "Middle",
    END : "End",
    SU : "Story Unit"
  }
};

story.prototype.getNodeAttributes = function (id) {
  return this.getAttributes(this.data.nodes[id].attributes);
};

story.prototype.getAttributes = function (attr) {
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

story.prototype.getNodeType = function (id) {
  return this.data.nodes[id].type;
};

story.prototype.getEdgeType = function (id) {
  return this.data.edges[id].type;
};

story.prototype.getAdjacentEdges = function (id) {
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
        attributes : this.getAttributes(curr.attributes);
      };
    }
  }

  return res;
};

story.prototype.getStoryTransitions = function (id) {
  var edges = this.getAdjacentEdges(id);
  var res = {};
  
  for (var edgeId in edges) {
    if (!edges.hasOwnProperty(edgeId)) {
      continue;
    }

    var curr = egdes[edgeId];
    if (curr.type == story.EDGES.TYPES.TRANSITION && curr.dir === 1) {
      res[edgeId] = {
        target : curr.target,
        name : getAttributes(curr.attributes)[story.EDGES.NAME]
      }
    }
  }

  return res;
};

story.prototype.getRoot = function () {
  for (var nodeId in this.nodes) {
    if (!this.nodes.hasOwnProperty(nodeId)) {
      continue;
    }
    
    var is = true;
    for (var edgeId in this.getAdjacentEdges(nodeId)) {
      if (!.hasOwnProperty(edge)) {
        continue;
      }
      
      if (this.getEdgeType(edgeId) == story.EDGES.TYPES.BME_SU) {
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
story.prototype.fall = function (id) {
  // to prevent loops
  var visited = [];
  while (!this.getNodeType(id) in story.NODES.TYPES.MEDIA && !id in visited) {
    visited.push(id);
    var nodeType = this.getNodeType(id);
    var adj = this.getAdjacentEdges(id);
    for (var edgeId in adj) {
      if (!adj.hasOwnProperty(edgeId)) {
        continue;
      }
      
      var edgeType = this.getEdgeType(edgeId);
      if (adj[edgeId].dir === 1 && (
        (nodeType == story.NODES.TYPES.SU && edgeType == story.EDGES.TYPES.SU_BME) ||
          (nodeType == story.NODES.TYPES.BEGIN && edgeType in [story.EDGES.TYPES.BME_SU, story.EDGES.TYPES.BME_MEDIA)
          ))) {
        id = adj[edgeId].target;
      }
    }
  }

  return id;
}

story.prototype.getEntryNode = function () {
  var root = this.getRoot();
  if (!root) {
    return null;
  }
  
};



// mockup story
story.mockup = {
    "attributes": {
        "label": {
            "id": "modelAttributes[label]",
            "name": "Label",
            "value": {
                "id": "modelAttributes[label]",
                "name": "Label",
                "value": "Model attributes"
            }
        },
        "left": 0,
        "top": 0,
        "width": 0,
        "height": 0,
        "zIndex": 0,
        "type": "ModelAttributesNode",
        "attributes": {}
    },
    "nodes": {
        "e9a4744f22924fdc2eec21bd": {
            "label": {
                "id": "e9a4744f22924fdc2eec21bd[title]",
                "name": "Title",
                "value": {
                    "id": "e9a4744f22924fdc2eec21bd[title]",
                    "name": "Title",
                    "value": "The Neck"
                }
            },
            "left": 4476.142857142857,
            "top": 4333.142857142857,
            "width": 50,
            "height": 50,
            "zIndex": 16001,
            "type": "Story Unit",
            "attributes": {
                "b7d4371e2eeedc3a278bd430": {
                    "id": "e9a4744f22924fdc2eec21bd[title]",
                    "name": "Title",
                    "value": {
                        "id": "e9a4744f22924fdc2eec21bd[title]",
                        "name": "Title",
                        "value": "The Neck"
                    }
                },
                "c27c8da2b8ac31d77d8c293d": {
                    "id": "e9a4744f22924fdc2eec21bd[problem]",
                    "name": "Problem",
                    "value": {
                        "id": "e9a4744f22924fdc2eec21bd[problem]",
                        "name": "Problem",
                        "value": "\"Test\""
                    }
                },
                "20ac923e4e1385bf16348057": {
                    "id": "e9a4744f22924fdc2eec21bd[solution]",
                    "name": "Solution",
                    "value": {
                        "id": "e9a4744f22924fdc2eec21bd[solution]",
                        "name": "Solution",
                        "value": ""
                    }
                }
            }
        },
        "b6e2e3c632ded27f165d0ac6": {
            "label": {
                "id": "b6e2e3c632ded27f165d0ac6[title]",
                "name": "Title",
                "value": {
                    "id": "b6e2e3c632ded27f165d0ac6[title]",
                    "name": "Title",
                    "value": "Introduction"
                }
            },
            "left": 4155.499999999998,
            "top": 4442.499999999998,
            "width": 40,
            "height": 40,
            "zIndex": 16002,
            "type": "Begin",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "b6e2e3c632ded27f165d0ac6[title]",
                    "name": "Title",
                    "value": {
                        "id": "b6e2e3c632ded27f165d0ac6[title]",
                        "name": "Title",
                        "value": "Introduction"
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "b6e2e3c632ded27f165d0ac6[note]",
                    "name": "Note",
                    "value": {
                        "id": "b6e2e3c632ded27f165d0ac6[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "2cdb917e7f2462ad38785268": {
            "label": {
                "id": "2cdb917e7f2462ad38785268[title]",
                "name": "Title",
                "value": {
                    "id": "2cdb917e7f2462ad38785268[title]",
                    "name": "Title",
                    "value": "Explanation"
                }
            },
            "left": 4479.999999999998,
            "top": 4439.499999999998,
            "width": 40,
            "height": 40,
            "zIndex": 16003,
            "type": "Middle",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "2cdb917e7f2462ad38785268[title]",
                    "name": "Title",
                    "value": {
                        "id": "2cdb917e7f2462ad38785268[title]",
                        "name": "Title",
                        "value": "Explanation"
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "2cdb917e7f2462ad38785268[note]",
                    "name": "Note",
                    "value": {
                        "id": "2cdb917e7f2462ad38785268[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "74b4b02f09a1fcbcd530e4fc": {
            "label": {
                "id": "74b4b02f09a1fcbcd530e4fc[title]",
                "name": "Title",
                "value": {
                    "id": "74b4b02f09a1fcbcd530e4fc[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4786.999999999998,
            "top": 4442.499999999998,
            "width": 40,
            "height": 40,
            "zIndex": 16004,
            "type": "End",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "74b4b02f09a1fcbcd530e4fc[title]",
                    "name": "Title",
                    "value": {
                        "id": "74b4b02f09a1fcbcd530e4fc[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "74b4b02f09a1fcbcd530e4fc[note]",
                    "name": "Note",
                    "value": {
                        "id": "74b4b02f09a1fcbcd530e4fc[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "ecb3ee04ecd24fba5fbeca9f": {
            "label": {
                "id": "ecb3ee04ecd24fba5fbeca9f[title]",
                "name": "Title",
                "value": {
                    "id": "ecb3ee04ecd24fba5fbeca9f[title]",
                    "name": "Title",
                    "value": "The Neck"
                }
            },
            "left": 3981.4285714285706,
            "top": 4712.857142857142,
            "width": 48.571428571428555,
            "height": 40.00000000000006,
            "zIndex": 16005,
            "type": "Text",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "ecb3ee04ecd24fba5fbeca9f[title]",
                    "name": "Title",
                    "value": {
                        "id": "ecb3ee04ecd24fba5fbeca9f[title]",
                        "name": "Title",
                        "value": "The Neck"
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "ecb3ee04ecd24fba5fbeca9f[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "ecb3ee04ecd24fba5fbeca9f[caption]",
                        "name": "Caption",
                        "value": "TODO"
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "ecb3ee04ecd24fba5fbeca9f[note]",
                    "name": "Note",
                    "value": {
                        "id": "ecb3ee04ecd24fba5fbeca9f[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "1398b03fafeb2509f80a4caf": {
                    "id": "ecb3ee04ecd24fba5fbeca9f[text]",
                    "name": "Text",
                    "value": {
                        "id": "ecb3ee04ecd24fba5fbeca9f[text]",
                        "name": "Text",
                        "value": ""
                    }
                }
            }
        },
        "c523e0c84da64f6908930391": {
            "label": {
                "id": "c523e0c84da64f6908930391[title]",
                "name": "Title",
                "value": {
                    "id": "c523e0c84da64f6908930391[title]",
                    "name": "Title",
                    "value": "Neck Introduction"
                }
            },
            "left": 4149,
            "top": 4526.714285714285,
            "width": 50,
            "height": 50,
            "zIndex": 16006,
            "type": "Story Unit",
            "attributes": {
                "b7d4371e2eeedc3a278bd430": {
                    "id": "c523e0c84da64f6908930391[title]",
                    "name": "Title",
                    "value": {
                        "id": "c523e0c84da64f6908930391[title]",
                        "name": "Title",
                        "value": "Neck Introduction"
                    }
                },
                "c27c8da2b8ac31d77d8c293d": {
                    "id": "c523e0c84da64f6908930391[problem]",
                    "name": "Problem",
                    "value": {
                        "id": "c523e0c84da64f6908930391[problem]",
                        "name": "Problem",
                        "value": ""
                    }
                },
                "20ac923e4e1385bf16348057": {
                    "id": "c523e0c84da64f6908930391[solution]",
                    "name": "Solution",
                    "value": {
                        "id": "c523e0c84da64f6908930391[solution]",
                        "name": "Solution",
                        "value": ""
                    }
                }
            }
        },
        "ec17dc718b170e2e375a0b3e": {
            "label": {
                "id": "ec17dc718b170e2e375a0b3e[title]",
                "name": "Title",
                "value": {
                    "id": "ec17dc718b170e2e375a0b3e[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 3985.2857142857138,
            "top": 4621.857142857142,
            "width": 40,
            "height": 40,
            "zIndex": 16007,
            "type": "Begin",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "ec17dc718b170e2e375a0b3e[title]",
                    "name": "Title",
                    "value": {
                        "id": "ec17dc718b170e2e375a0b3e[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "ec17dc718b170e2e375a0b3e[note]",
                    "name": "Note",
                    "value": {
                        "id": "ec17dc718b170e2e375a0b3e[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "b65f2e08585d6c894872856d": {
            "label": {
                "id": "b65f2e08585d6c894872856d[title]",
                "name": "Title",
                "value": {
                    "id": "b65f2e08585d6c894872856d[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4153.571428571428,
            "top": 4618,
            "width": 41.428571428571445,
            "height": 40,
            "zIndex": 16008,
            "type": "Middle",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "b65f2e08585d6c894872856d[title]",
                    "name": "Title",
                    "value": {
                        "id": "b65f2e08585d6c894872856d[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "b65f2e08585d6c894872856d[note]",
                    "name": "Note",
                    "value": {
                        "id": "b65f2e08585d6c894872856d[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "52340a5add2b2139a086b6a2": {
            "label": {
                "id": "52340a5add2b2139a086b6a2[title]",
                "name": "Title",
                "value": {
                    "id": "52340a5add2b2139a086b6a2[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4307.714285714285,
            "top": 4617.285714285714,
            "width": 40,
            "height": 40,
            "zIndex": 16009,
            "type": "End",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "52340a5add2b2139a086b6a2[title]",
                    "name": "Title",
                    "value": {
                        "id": "52340a5add2b2139a086b6a2[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "52340a5add2b2139a086b6a2[note]",
                    "name": "Note",
                    "value": {
                        "id": "52340a5add2b2139a086b6a2[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "2ce4a708995346b0b6a32019": {
            "label": {
                "id": "2ce4a708995346b0b6a32019[label]",
                "name": "Label",
                "value": {
                    "id": "2ce4a708995346b0b6a32019[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "left": 4188.642857142857,
            "top": 4679.142857142857,
            "width": 45,
            "height": 30,
            "zIndex": 16011,
            "type": "3D View",
            "attributes": {
                "400020c1cd610ddfcb091c65": {
                    "id": "2ce4a708995346b0b6a32019[setting]",
                    "name": "Setting",
                    "value": {
                        "id": "2ce4a708995346b0b6a32019[setting]",
                        "name": "Setting",
                        "value": ""
                    }
                }
            }
        },
        "3e7c383eb91cc53c52319aa5": {
            "label": {
                "id": "3e7c383eb91cc53c52319aa5[title]",
                "name": "Title",
                "value": {
                    "id": "3e7c383eb91cc53c52319aa5[title]",
                    "name": "Title",
                    "value": "A"
                }
            },
            "left": 4110.142857142857,
            "top": 4786.785714285714,
            "width": 20,
            "height": 35,
            "zIndex": 16012,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "3e7c383eb91cc53c52319aa5[title]",
                    "name": "Title",
                    "value": {
                        "id": "3e7c383eb91cc53c52319aa5[title]",
                        "name": "Title",
                        "value": "A"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "3e7c383eb91cc53c52319aa5[description]",
                    "name": "Description",
                    "value": {
                        "id": "3e7c383eb91cc53c52319aa5[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "3e7c383eb91cc53c52319aa5[position]",
                    "name": "Position",
                    "value": {
                        "id": "3e7c383eb91cc53c52319aa5[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "a7e4f55453c0e387ff1e6574": {
            "label": {
                "id": "a7e4f55453c0e387ff1e6574[title]",
                "name": "Title",
                "value": {
                    "id": "a7e4f55453c0e387ff1e6574[title]",
                    "name": "Title",
                    "value": "D"
                }
            },
            "left": 4134.714285714285,
            "top": 4797.214285714285,
            "width": 20,
            "height": 35,
            "zIndex": 16013,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "a7e4f55453c0e387ff1e6574[title]",
                    "name": "Title",
                    "value": {
                        "id": "a7e4f55453c0e387ff1e6574[title]",
                        "name": "Title",
                        "value": "D"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "a7e4f55453c0e387ff1e6574[description]",
                    "name": "Description",
                    "value": {
                        "id": "a7e4f55453c0e387ff1e6574[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "a7e4f55453c0e387ff1e6574[position]",
                    "name": "Position",
                    "value": {
                        "id": "a7e4f55453c0e387ff1e6574[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "4dd9c39a5537a44c77d0eed3": {
            "label": {
                "id": "4dd9c39a5537a44c77d0eed3[title]",
                "name": "Title",
                "value": {
                    "id": "4dd9c39a5537a44c77d0eed3[title]",
                    "name": "Title",
                    "value": "G"
                }
            },
            "left": 4174.285714285714,
            "top": 4796.214285714285,
            "width": 20,
            "height": 35,
            "zIndex": 16014,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "4dd9c39a5537a44c77d0eed3[title]",
                    "name": "Title",
                    "value": {
                        "id": "4dd9c39a5537a44c77d0eed3[title]",
                        "name": "Title",
                        "value": "G"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "4dd9c39a5537a44c77d0eed3[description]",
                    "name": "Description",
                    "value": {
                        "id": "4dd9c39a5537a44c77d0eed3[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "4dd9c39a5537a44c77d0eed3[position]",
                    "name": "Position",
                    "value": {
                        "id": "4dd9c39a5537a44c77d0eed3[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "6a9c43f43661992ce32a304c": {
            "label": {
                "id": "6a9c43f43661992ce32a304c[title]",
                "name": "Title",
                "value": {
                    "id": "6a9c43f43661992ce32a304c[title]",
                    "name": "Title",
                    "value": "H"
                }
            },
            "left": 4208.571428571428,
            "top": 4785.499999999999,
            "width": 20,
            "height": 35,
            "zIndex": 16015,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "6a9c43f43661992ce32a304c[title]",
                    "name": "Title",
                    "value": {
                        "id": "6a9c43f43661992ce32a304c[title]",
                        "name": "Title",
                        "value": "H"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "6a9c43f43661992ce32a304c[description]",
                    "name": "Description",
                    "value": {
                        "id": "6a9c43f43661992ce32a304c[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "6a9c43f43661992ce32a304c[position]",
                    "name": "Position",
                    "value": {
                        "id": "6a9c43f43661992ce32a304c[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "002d94c5d2c755390e36318d": {
            "label": {
                "id": "002d94c5d2c755390e36318d[title]",
                "name": "Title",
                "value": {
                    "id": "002d94c5d2c755390e36318d[title]",
                    "name": "Title",
                    "value": "E"
                }
            },
            "left": 4234.571428571428,
            "top": 4754.642857142857,
            "width": 18.571428571428584,
            "height": 35,
            "zIndex": 16016,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "002d94c5d2c755390e36318d[title]",
                    "name": "Title",
                    "value": {
                        "id": "002d94c5d2c755390e36318d[title]",
                        "name": "Title",
                        "value": "E"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "002d94c5d2c755390e36318d[description]",
                    "name": "Description",
                    "value": {
                        "id": "002d94c5d2c755390e36318d[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "002d94c5d2c755390e36318d[position]",
                    "name": "Position",
                    "value": {
                        "id": "002d94c5d2c755390e36318d[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "de5bcdb7c4f36db1362a0dc4": {
            "label": {
                "id": "de5bcdb7c4f36db1362a0dc4[title]",
                "name": "Title",
                "value": {
                    "id": "de5bcdb7c4f36db1362a0dc4[title]",
                    "name": "Title",
                    "value": "e"
                }
            },
            "left": 4095,
            "top": 4757.642857142857,
            "width": 20,
            "height": 35,
            "zIndex": 16017,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "de5bcdb7c4f36db1362a0dc4[title]",
                    "name": "Title",
                    "value": {
                        "id": "de5bcdb7c4f36db1362a0dc4[title]",
                        "name": "Title",
                        "value": "e"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "de5bcdb7c4f36db1362a0dc4[description]",
                    "name": "Description",
                    "value": {
                        "id": "de5bcdb7c4f36db1362a0dc4[description]",
                        "name": "Description",
                        "value": "In some genres (harder rock to metal), this string is tuned down to d, which is called the \"drop d\" tuning"
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "de5bcdb7c4f36db1362a0dc4[position]",
                    "name": "Position",
                    "value": {
                        "id": "de5bcdb7c4f36db1362a0dc4[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "88f4f48a887ac4ee90b373ae": {
            "label": {
                "id": "88f4f48a887ac4ee90b373ae[title]",
                "name": "Title",
                "value": {
                    "id": "88f4f48a887ac4ee90b373ae[title]",
                    "name": "Title",
                    "value": "The Strings"
                }
            },
            "left": 4152.857142857142,
            "top": 4711.714285714285,
            "width": 40,
            "height": 30,
            "zIndex": 16018,
            "type": "Video",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "88f4f48a887ac4ee90b373ae[title]",
                    "name": "Title",
                    "value": {
                        "id": "88f4f48a887ac4ee90b373ae[title]",
                        "name": "Title",
                        "value": "The Strings"
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "88f4f48a887ac4ee90b373ae[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "88f4f48a887ac4ee90b373ae[caption]",
                        "name": "Caption",
                        "value": ""
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "88f4f48a887ac4ee90b373ae[note]",
                    "name": "Note",
                    "value": {
                        "id": "88f4f48a887ac4ee90b373ae[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "11ada9037bf206b8f741b556": {
                    "id": "88f4f48a887ac4ee90b373ae[url]",
                    "name": "URL",
                    "value": {
                        "id": "88f4f48a887ac4ee90b373ae[url]",
                        "name": "URL",
                        "value": ""
                    }
                }
            }
        },
        "c1bbcac647567a945b738ff3": {
            "label": {
                "id": "c1bbcac647567a945b738ff3[title]",
                "name": "Title",
                "value": {
                    "id": "c1bbcac647567a945b738ff3[title]",
                    "name": "Title",
                    "value": "The next step..."
                }
            },
            "left": 4310,
            "top": 4719.142857142857,
            "width": 40,
            "height": 30,
            "zIndex": 16019,
            "type": "Text",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "c1bbcac647567a945b738ff3[title]",
                    "name": "Title",
                    "value": {
                        "id": "c1bbcac647567a945b738ff3[title]",
                        "name": "Title",
                        "value": "The next step..."
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "c1bbcac647567a945b738ff3[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "c1bbcac647567a945b738ff3[caption]",
                        "name": "Caption",
                        "value": "TODO"
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "c1bbcac647567a945b738ff3[note]",
                    "name": "Note",
                    "value": {
                        "id": "c1bbcac647567a945b738ff3[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "1398b03fafeb2509f80a4caf": {
                    "id": "c1bbcac647567a945b738ff3[text]",
                    "name": "Text",
                    "value": {
                        "id": "c1bbcac647567a945b738ff3[text]",
                        "name": "Text",
                        "value": ""
                    }
                }
            }
        },
        "e1bdc5af1901d104ababffed": {
            "label": {
                "id": "e1bdc5af1901d104ababffed[label]",
                "name": "Label",
                "value": {
                    "id": "e1bdc5af1901d104ababffed[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "left": 4345.642857142857,
            "top": 4682.285714285714,
            "width": 45,
            "height": 30,
            "zIndex": 16022,
            "type": "3D View",
            "attributes": {
                "400020c1cd610ddfcb091c65": {
                    "id": "e1bdc5af1901d104ababffed[setting]",
                    "name": "Setting",
                    "value": {
                        "id": "e1bdc5af1901d104ababffed[setting]",
                        "name": "Setting",
                        "value": ""
                    }
                }
            }
        },
        "50c0ecdd203328b88afba26d": {
            "label": {
                "id": "50c0ecdd203328b88afba26d[title]",
                "name": "Title",
                "value": {
                    "id": "50c0ecdd203328b88afba26d[title]",
                    "name": "Title",
                    "value": "The Pentatonic Scale"
                }
            },
            "left": 4420.142857142857,
            "top": 4783.571428571428,
            "width": 50,
            "height": 50,
            "zIndex": 16023,
            "type": "Story Unit",
            "attributes": {
                "b7d4371e2eeedc3a278bd430": {
                    "id": "50c0ecdd203328b88afba26d[title]",
                    "name": "Title",
                    "value": {
                        "id": "50c0ecdd203328b88afba26d[title]",
                        "name": "Title",
                        "value": "The Pentatonic Scale"
                    }
                },
                "c27c8da2b8ac31d77d8c293d": {
                    "id": "50c0ecdd203328b88afba26d[problem]",
                    "name": "Problem",
                    "value": {
                        "id": "50c0ecdd203328b88afba26d[problem]",
                        "name": "Problem",
                        "value": ""
                    }
                },
                "20ac923e4e1385bf16348057": {
                    "id": "50c0ecdd203328b88afba26d[solution]",
                    "name": "Solution",
                    "value": {
                        "id": "50c0ecdd203328b88afba26d[solution]",
                        "name": "Solution",
                        "value": ""
                    }
                }
            }
        },
        "aec1fbd12b04a330440d5bd2": {
            "label": {
                "id": "aec1fbd12b04a330440d5bd2[title]",
                "name": "Title",
                "value": {
                    "id": "aec1fbd12b04a330440d5bd2[title]",
                    "name": "Title",
                    "value": "The Pentatonic Scale"
                }
            },
            "left": 4311.333333333333,
            "top": 4861.333333333333,
            "width": 40,
            "height": 40,
            "zIndex": 16025,
            "type": "Begin",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "aec1fbd12b04a330440d5bd2[title]",
                    "name": "Title",
                    "value": {
                        "id": "aec1fbd12b04a330440d5bd2[title]",
                        "name": "Title",
                        "value": "The Pentatonic Scale"
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "aec1fbd12b04a330440d5bd2[note]",
                    "name": "Note",
                    "value": {
                        "id": "aec1fbd12b04a330440d5bd2[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "d12ce79294533cb9f6958b26": {
            "label": {
                "id": "d12ce79294533cb9f6958b26[title]",
                "name": "Title",
                "value": {
                    "id": "d12ce79294533cb9f6958b26[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4424.333333333333,
            "top": 4865.333333333333,
            "width": 40,
            "height": 40,
            "zIndex": 16026,
            "type": "Middle",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "d12ce79294533cb9f6958b26[title]",
                    "name": "Title",
                    "value": {
                        "id": "d12ce79294533cb9f6958b26[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "d12ce79294533cb9f6958b26[note]",
                    "name": "Note",
                    "value": {
                        "id": "d12ce79294533cb9f6958b26[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "0629e54e10e0c0002f5ec502": {
            "label": {
                "id": "0629e54e10e0c0002f5ec502[title]",
                "name": "Title",
                "value": {
                    "id": "0629e54e10e0c0002f5ec502[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4538.333333333333,
            "top": 4856.999999999999,
            "width": 40,
            "height": 40,
            "zIndex": 16027,
            "type": "End",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "0629e54e10e0c0002f5ec502[title]",
                    "name": "Title",
                    "value": {
                        "id": "0629e54e10e0c0002f5ec502[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "0629e54e10e0c0002f5ec502[note]",
                    "name": "Note",
                    "value": {
                        "id": "0629e54e10e0c0002f5ec502[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "9d8e0e4187672c4da03f46fd": {
            "label": {
                "id": "9d8e0e4187672c4da03f46fd[title]",
                "name": "Title",
                "value": {
                    "id": "9d8e0e4187672c4da03f46fd[title]",
                    "name": "Title",
                    "value": "Soloing"
                }
            },
            "left": 4244.666666666666,
            "top": 4939.999999999999,
            "width": 40,
            "height": 30,
            "zIndex": 16028,
            "type": "Video",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "9d8e0e4187672c4da03f46fd[title]",
                    "name": "Title",
                    "value": {
                        "id": "9d8e0e4187672c4da03f46fd[title]",
                        "name": "Title",
                        "value": "Soloing"
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "9d8e0e4187672c4da03f46fd[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "9d8e0e4187672c4da03f46fd[caption]",
                        "name": "Caption",
                        "value": ""
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "9d8e0e4187672c4da03f46fd[note]",
                    "name": "Note",
                    "value": {
                        "id": "9d8e0e4187672c4da03f46fd[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "11ada9037bf206b8f741b556": {
                    "id": "9d8e0e4187672c4da03f46fd[url]",
                    "name": "URL",
                    "value": {
                        "id": "9d8e0e4187672c4da03f46fd[url]",
                        "name": "URL",
                        "value": ""
                    }
                }
            }
        },
        "574d27e34b719a6cc29c3140": {
            "label": {
                "id": "574d27e34b719a6cc29c3140[title]",
                "name": "Title",
                "value": {
                    "id": "574d27e34b719a6cc29c3140[title]",
                    "name": "Title",
                    "value": "The Pentatonic Scale"
                }
            },
            "left": 4423.666666666666,
            "top": 4952.999999999999,
            "width": 40,
            "height": 30,
            "zIndex": 16029,
            "type": "Image",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "574d27e34b719a6cc29c3140[title]",
                    "name": "Title",
                    "value": {
                        "id": "574d27e34b719a6cc29c3140[title]",
                        "name": "Title",
                        "value": "The Pentatonic Scale"
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "574d27e34b719a6cc29c3140[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "574d27e34b719a6cc29c3140[caption]",
                        "name": "Caption",
                        "value": ""
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "574d27e34b719a6cc29c3140[note]",
                    "name": "Note",
                    "value": {
                        "id": "574d27e34b719a6cc29c3140[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "a2f1f83775db5e30c5530946": {
                    "id": "574d27e34b719a6cc29c3140[url]",
                    "name": "URL",
                    "value": {
                        "id": "574d27e34b719a6cc29c3140[url]",
                        "name": "URL",
                        "value": ""
                    }
                }
            }
        },
        "c97bc2a9d1e23e1c04aabc48": {
            "label": {
                "id": "c97bc2a9d1e23e1c04aabc48[title]",
                "name": "Title",
                "value": {
                    "id": "c97bc2a9d1e23e1c04aabc48[title]",
                    "name": "Title",
                    "value": "Conclusion"
                }
            },
            "left": 4538.666666666666,
            "top": 4951.999999999999,
            "width": 41.66666666666663,
            "height": 30,
            "zIndex": 16030,
            "type": "Text",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "c97bc2a9d1e23e1c04aabc48[title]",
                    "name": "Title",
                    "value": {
                        "id": "c97bc2a9d1e23e1c04aabc48[title]",
                        "name": "Title",
                        "value": "Conclusion"
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "c97bc2a9d1e23e1c04aabc48[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "c97bc2a9d1e23e1c04aabc48[caption]",
                        "name": "Caption",
                        "value": ""
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "c97bc2a9d1e23e1c04aabc48[note]",
                    "name": "Note",
                    "value": {
                        "id": "c97bc2a9d1e23e1c04aabc48[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "1398b03fafeb2509f80a4caf": {
                    "id": "c97bc2a9d1e23e1c04aabc48[text]",
                    "name": "Text",
                    "value": {
                        "id": "c97bc2a9d1e23e1c04aabc48[text]",
                        "name": "Text",
                        "value": ""
                    }
                }
            }
        },
        "f98a8b07c61afc4b810c0a88": {
            "label": {
                "id": "f98a8b07c61afc4b810c0a88[label]",
                "name": "Label",
                "value": {
                    "id": "f98a8b07c61afc4b810c0a88[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "left": 4507.833333333333,
            "top": 5005.333333333333,
            "width": 45,
            "height": 30,
            "zIndex": 16031,
            "type": "3D View",
            "attributes": {
                "400020c1cd610ddfcb091c65": {
                    "id": "f98a8b07c61afc4b810c0a88[setting]",
                    "name": "Setting",
                    "value": {
                        "id": "f98a8b07c61afc4b810c0a88[setting]",
                        "name": "Setting",
                        "value": ""
                    }
                }
            }
        },
        "9dc54660417db048d93f1b95": {
            "label": {
                "id": "9dc54660417db048d93f1b95[title]",
                "name": "Title",
                "value": {
                    "id": "9dc54660417db048d93f1b95[title]",
                    "name": "Title",
                    "value": "5th fret"
                }
            },
            "left": 4568.333333333333,
            "top": 5002.499999999999,
            "width": 20,
            "height": 36.666666666666686,
            "zIndex": 16032,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "9dc54660417db048d93f1b95[title]",
                    "name": "Title",
                    "value": {
                        "id": "9dc54660417db048d93f1b95[title]",
                        "name": "Title",
                        "value": "5th fret"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "9dc54660417db048d93f1b95[description]",
                    "name": "Description",
                    "value": {
                        "id": "9dc54660417db048d93f1b95[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "9dc54660417db048d93f1b95[position]",
                    "name": "Position",
                    "value": {
                        "id": "9dc54660417db048d93f1b95[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "108fc0c124e121cce80d3a2b": {
            "label": {
                "id": "108fc0c124e121cce80d3a2b[title]",
                "name": "Title",
                "value": {
                    "id": "108fc0c124e121cce80d3a2b[title]",
                    "name": "Title",
                    "value": "2nd fret"
                }
            },
            "left": 4593.333333333333,
            "top": 4987.499999999999,
            "width": 20,
            "height": 35,
            "zIndex": 16033,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "108fc0c124e121cce80d3a2b[title]",
                    "name": "Title",
                    "value": {
                        "id": "108fc0c124e121cce80d3a2b[title]",
                        "name": "Title",
                        "value": "2nd fret"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "108fc0c124e121cce80d3a2b[description]",
                    "name": "Description",
                    "value": {
                        "id": "108fc0c124e121cce80d3a2b[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "108fc0c124e121cce80d3a2b[position]",
                    "name": "Position",
                    "value": {
                        "id": "108fc0c124e121cce80d3a2b[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "4073e2e3f5aed773bf778883": {
            "label": {
                "id": "4073e2e3f5aed773bf778883[title]",
                "name": "Title",
                "value": {
                    "id": "4073e2e3f5aed773bf778883[title]",
                    "name": "Title",
                    "value": "Chords"
                }
            },
            "left": 4675.333333333333,
            "top": 4489.333333333333,
            "width": 50,
            "height": 50,
            "zIndex": 16034,
            "type": "Story Unit",
            "attributes": {
                "b7d4371e2eeedc3a278bd430": {
                    "id": "4073e2e3f5aed773bf778883[title]",
                    "name": "Title",
                    "value": {
                        "id": "4073e2e3f5aed773bf778883[title]",
                        "name": "Title",
                        "value": "Chords"
                    }
                },
                "c27c8da2b8ac31d77d8c293d": {
                    "id": "4073e2e3f5aed773bf778883[problem]",
                    "name": "Problem",
                    "value": {
                        "id": "4073e2e3f5aed773bf778883[problem]",
                        "name": "Problem",
                        "value": ""
                    }
                },
                "20ac923e4e1385bf16348057": {
                    "id": "4073e2e3f5aed773bf778883[solution]",
                    "name": "Solution",
                    "value": {
                        "id": "4073e2e3f5aed773bf778883[solution]",
                        "name": "Solution",
                        "value": ""
                    }
                }
            }
        },
        "5c82a0cefbd77924359f978e": {
            "label": {
                "id": "5c82a0cefbd77924359f978e[label]",
                "name": "Label",
                "value": {
                    "id": "5c82a0cefbd77924359f978e[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "left": 4200.833333333333,
            "top": 5011.333333333333,
            "width": 45,
            "height": 30,
            "zIndex": 16035,
            "type": "3D View",
            "attributes": {
                "400020c1cd610ddfcb091c65": {
                    "id": "5c82a0cefbd77924359f978e[setting]",
                    "name": "Setting",
                    "value": {
                        "id": "5c82a0cefbd77924359f978e[setting]",
                        "name": "Setting",
                        "value": ""
                    }
                }
            }
        },
        "f5ca5860adfd2245277cca7c": {
            "label": {
                "id": "f5ca5860adfd2245277cca7c[title]",
                "name": "Title",
                "value": {
                    "id": "f5ca5860adfd2245277cca7c[title]",
                    "name": "Title",
                    "value": "7th fret"
                }
            },
            "left": 4258.999999999999,
            "top": 5009.499999999999,
            "width": 20,
            "height": 35,
            "zIndex": 16037,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "f5ca5860adfd2245277cca7c[title]",
                    "name": "Title",
                    "value": {
                        "id": "f5ca5860adfd2245277cca7c[title]",
                        "name": "Title",
                        "value": "7th fret"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "f5ca5860adfd2245277cca7c[description]",
                    "name": "Description",
                    "value": {
                        "id": "f5ca5860adfd2245277cca7c[description]",
                        "name": "Description",
                        "value": ""
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "f5ca5860adfd2245277cca7c[position]",
                    "name": "Position",
                    "value": {
                        "id": "f5ca5860adfd2245277cca7c[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "1b96cf7859948316278d84e4": {
            "label": {
                "id": "1b96cf7859948316278d84e4[title]",
                "name": "Title",
                "value": {
                    "id": "1b96cf7859948316278d84e4[title]",
                    "name": "Title",
                    "value": "5th fret"
                }
            },
            "left": 4404.999999999999,
            "top": 5024.166666666666,
            "width": 20,
            "height": 35,
            "zIndex": 16038,
            "type": "3D Tag",
            "attributes": {
                "ea65455051ac389cebc0f59b": {
                    "id": "1b96cf7859948316278d84e4[title]",
                    "name": "Title",
                    "value": {
                        "id": "1b96cf7859948316278d84e4[title]",
                        "name": "Title",
                        "value": "5th fret"
                    }
                },
                "33ea0769d997899fb62fd890": {
                    "id": "1b96cf7859948316278d84e4[description]",
                    "name": "Description",
                    "value": {
                        "id": "1b96cf7859948316278d84e4[description]",
                        "name": "Description",
                        "value": "This is where the (first) pentatonic shape is usually placed in tutorials."
                    }
                },
                "ae6930b066d709cc0884891b": {
                    "id": "1b96cf7859948316278d84e4[position]",
                    "name": "Position",
                    "value": {
                        "id": "1b96cf7859948316278d84e4[position]",
                        "name": "Position",
                        "value": ""
                    }
                }
            }
        },
        "b7e41e042ecd6734efc5dc05": {
            "label": {
                "id": "b7e41e042ecd6734efc5dc05[title]",
                "name": "Title",
                "value": {
                    "id": "b7e41e042ecd6734efc5dc05[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4577.333333333333,
            "top": 4585.666666666666,
            "width": 40,
            "height": 40,
            "zIndex": 16039,
            "type": "Begin",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "b7e41e042ecd6734efc5dc05[title]",
                    "name": "Title",
                    "value": {
                        "id": "b7e41e042ecd6734efc5dc05[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "b7e41e042ecd6734efc5dc05[note]",
                    "name": "Note",
                    "value": {
                        "id": "b7e41e042ecd6734efc5dc05[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "60ddd111c83f765f48ee8fbc": {
            "label": {
                "id": "60ddd111c83f765f48ee8fbc[title]",
                "name": "Title",
                "value": {
                    "id": "60ddd111c83f765f48ee8fbc[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4674.999999999999,
            "top": 4584.333333333333,
            "width": 48.33333333333337,
            "height": 46.666666666666686,
            "zIndex": 16040,
            "type": "Middle",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "60ddd111c83f765f48ee8fbc[title]",
                    "name": "Title",
                    "value": {
                        "id": "60ddd111c83f765f48ee8fbc[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "60ddd111c83f765f48ee8fbc[note]",
                    "name": "Note",
                    "value": {
                        "id": "60ddd111c83f765f48ee8fbc[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "3998e470677c1df40b3fe51c": {
            "label": {
                "id": "3998e470677c1df40b3fe51c[title]",
                "name": "Title",
                "value": {
                    "id": "3998e470677c1df40b3fe51c[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4784.333333333333,
            "top": 4579.333333333333,
            "width": 40,
            "height": 40,
            "zIndex": 16041,
            "type": "End",
            "attributes": {
                "7c8c8a7fcd05cee17acccf7f": {
                    "id": "3998e470677c1df40b3fe51c[title]",
                    "name": "Title",
                    "value": {
                        "id": "3998e470677c1df40b3fe51c[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "87c8a5f662a531d48481c410": {
                    "id": "3998e470677c1df40b3fe51c[note]",
                    "name": "Note",
                    "value": {
                        "id": "3998e470677c1df40b3fe51c[note]",
                        "name": "Note",
                        "value": ""
                    }
                }
            }
        },
        "3b04a992977a28acf2c00dd1": {
            "label": {
                "id": "3b04a992977a28acf2c00dd1[title]",
                "name": "Title",
                "value": {
                    "id": "3b04a992977a28acf2c00dd1[title]",
                    "name": "Title",
                    "value": ""
                }
            },
            "left": 4564.999999999999,
            "top": 4664.999999999999,
            "width": 40,
            "height": 30,
            "zIndex": 16042,
            "type": "Video",
            "attributes": {
                "3b64e0275124801a9e316c22": {
                    "id": "3b04a992977a28acf2c00dd1[title]",
                    "name": "Title",
                    "value": {
                        "id": "3b04a992977a28acf2c00dd1[title]",
                        "name": "Title",
                        "value": ""
                    }
                },
                "1d2f399b4bb3c141d7410b56": {
                    "id": "3b04a992977a28acf2c00dd1[caption]",
                    "name": "Caption",
                    "value": {
                        "id": "3b04a992977a28acf2c00dd1[caption]",
                        "name": "Caption",
                        "value": "Who wants to put all the effort into becoming a true shredder, if all the ladies want you to do is to belt out Wonderwall?"
                    }
                },
                "3c2cccfaecd450576faea333": {
                    "id": "3b04a992977a28acf2c00dd1[note]",
                    "name": "Note",
                    "value": {
                        "id": "3b04a992977a28acf2c00dd1[note]",
                        "name": "Note",
                        "value": ""
                    }
                },
                "11ada9037bf206b8f741b556": {
                    "id": "3b04a992977a28acf2c00dd1[url]",
                    "name": "URL",
                    "value": {
                        "id": "3b04a992977a28acf2c00dd1[url]",
                        "name": "URL",
                        "value": ""
                    }
                }
            }
        }
    },
    "edges": {
        "e0bc0e26396be1fd0fe6b926": {
            "label": {
                "id": "e0bc0e26396be1fd0fe6b926[label]",
                "name": "Label",
                "value": {
                    "id": "e0bc0e26396be1fd0fe6b926[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "de5bcdb7c4f36db1362a0dc4",
            "target": "88f4f48a887ac4ee90b373ae",
            "attributes": {},
            "type": "Tag Connection"
        },
        "21e0b1a763b5ac6aff4201c1": {
            "label": {
                "id": "21e0b1a763b5ac6aff4201c1[label]",
                "name": "Label",
                "value": {
                    "id": "21e0b1a763b5ac6aff4201c1[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "88f4f48a887ac4ee90b373ae",
            "target": "3e7c383eb91cc53c52319aa5",
            "attributes": {},
            "type": "Tag Connection"
        },
        "43100fa38932175cf52737f6": {
            "label": {
                "id": "43100fa38932175cf52737f6[label]",
                "name": "Label",
                "value": {
                    "id": "43100fa38932175cf52737f6[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "88f4f48a887ac4ee90b373ae",
            "target": "a7e4f55453c0e387ff1e6574",
            "attributes": {},
            "type": "Tag Connection"
        },
        "8d8d13431dd2d83828c07104": {
            "label": {
                "id": "8d8d13431dd2d83828c07104[label]",
                "name": "Label",
                "value": {
                    "id": "8d8d13431dd2d83828c07104[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "88f4f48a887ac4ee90b373ae",
            "target": "4dd9c39a5537a44c77d0eed3",
            "attributes": {},
            "type": "Tag Connection"
        },
        "0f7547e6bb96820c2e871e38": {
            "label": {
                "id": "0f7547e6bb96820c2e871e38[label]",
                "name": "Label",
                "value": {
                    "id": "0f7547e6bb96820c2e871e38[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "88f4f48a887ac4ee90b373ae",
            "target": "6a9c43f43661992ce32a304c",
            "attributes": {},
            "type": "Tag Connection"
        },
        "5872640638369bb5bc765246": {
            "label": {
                "id": "5872640638369bb5bc765246[label]",
                "name": "Label",
                "value": {
                    "id": "5872640638369bb5bc765246[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "88f4f48a887ac4ee90b373ae",
            "target": "002d94c5d2c755390e36318d",
            "attributes": {},
            "type": "Tag Connection"
        },
        "ffec6075b70eaa3cdcc279bf": {
            "label": {
                "id": "ffec6075b70eaa3cdcc279bf[label]",
                "name": "Label",
                "value": {
                    "id": "ffec6075b70eaa3cdcc279bf[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "2ce4a708995346b0b6a32019",
            "target": "88f4f48a887ac4ee90b373ae",
            "attributes": {},
            "type": "View Connection"
        },
        "d0d7712255d56bacb3f26905": {
            "label": {
                "id": "d0d7712255d56bacb3f26905[label]",
                "name": "Label",
                "value": {
                    "id": "d0d7712255d56bacb3f26905[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "ecb3ee04ecd24fba5fbeca9f",
            "target": "88f4f48a887ac4ee90b373ae",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "d0d7712255d56bacb3f26905[name]",
                    "name": "Name",
                    "value": {
                        "id": "d0d7712255d56bacb3f26905[name]",
                        "name": "Name",
                        "value": ""
                    }
                }
            },
            "type": "Story Transition"
        },
        "fa7258f5e4ad9feb0c876136": {
            "label": {
                "id": "fa7258f5e4ad9feb0c876136[label]",
                "name": "Label",
                "value": {
                    "id": "fa7258f5e4ad9feb0c876136[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "ec17dc718b170e2e375a0b3e",
            "target": "ecb3ee04ecd24fba5fbeca9f",
            "attributes": {},
            "type": "Media Connection"
        },
        "1645ada502d11fb511d00a69": {
            "label": {
                "id": "1645ada502d11fb511d00a69[label]",
                "name": "Label",
                "value": {
                    "id": "1645ada502d11fb511d00a69[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "b65f2e08585d6c894872856d",
            "target": "88f4f48a887ac4ee90b373ae",
            "attributes": {},
            "type": "Media Connection"
        },
        "37fb98b4534b1cdc8cbf4503": {
            "label": {
                "id": "37fb98b4534b1cdc8cbf4503[label]",
                "name": "Label",
                "value": {
                    "id": "37fb98b4534b1cdc8cbf4503[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c523e0c84da64f6908930391",
            "target": "ec17dc718b170e2e375a0b3e",
            "attributes": {},
            "type": "BME split"
        },
        "a05a926266b815db0bfd491f": {
            "label": {
                "id": "a05a926266b815db0bfd491f[label]",
                "name": "Label",
                "value": {
                    "id": "a05a926266b815db0bfd491f[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c523e0c84da64f6908930391",
            "target": "b65f2e08585d6c894872856d",
            "attributes": {},
            "type": "BME split"
        },
        "c9bf90f40de372615877b5ef": {
            "label": {
                "id": "c9bf90f40de372615877b5ef[label]",
                "name": "Label",
                "value": {
                    "id": "c9bf90f40de372615877b5ef[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c523e0c84da64f6908930391",
            "target": "52340a5add2b2139a086b6a2",
            "attributes": {},
            "type": "BME split"
        },
        "1a1855644bfa741751738853": {
            "label": {
                "id": "1a1855644bfa741751738853[label]",
                "name": "Label",
                "value": {
                    "id": "1a1855644bfa741751738853[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "e9a4744f22924fdc2eec21bd",
            "target": "b6e2e3c632ded27f165d0ac6",
            "attributes": {},
            "type": "BME split"
        },
        "7ce7f7328ee0bcf6606a7748": {
            "label": {
                "id": "7ce7f7328ee0bcf6606a7748[label]",
                "name": "Label",
                "value": {
                    "id": "7ce7f7328ee0bcf6606a7748[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "e9a4744f22924fdc2eec21bd",
            "target": "2cdb917e7f2462ad38785268",
            "attributes": {},
            "type": "BME split"
        },
        "57cb2fb0932f75a57982a498": {
            "label": {
                "id": "57cb2fb0932f75a57982a498[label]",
                "name": "Label",
                "value": {
                    "id": "57cb2fb0932f75a57982a498[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "e9a4744f22924fdc2eec21bd",
            "target": "74b4b02f09a1fcbcd530e4fc",
            "attributes": {},
            "type": "BME split"
        },
        "c0b4dec711a4b9819e459df3": {
            "label": {
                "id": "c0b4dec711a4b9819e459df3[label]",
                "name": "Label",
                "value": {
                    "id": "c0b4dec711a4b9819e459df3[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "b6e2e3c632ded27f165d0ac6",
            "target": "c523e0c84da64f6908930391",
            "attributes": {},
            "type": "BME -> SU"
        },
        "dc30564e100b6b9149dc5098": {
            "label": {
                "id": "dc30564e100b6b9149dc5098[label]",
                "name": "Label",
                "value": {
                    "id": "dc30564e100b6b9149dc5098[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "52340a5add2b2139a086b6a2",
            "target": "c1bbcac647567a945b738ff3",
            "attributes": {},
            "type": "Media Connection"
        },
        "7fe052fa54d06f39a0b17d9c": {
            "label": {
                "id": "7fe052fa54d06f39a0b17d9c[label]",
                "name": "Label",
                "value": {
                    "id": "7fe052fa54d06f39a0b17d9c[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "88f4f48a887ac4ee90b373ae",
            "target": "c1bbcac647567a945b738ff3",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "7fe052fa54d06f39a0b17d9c[name]",
                    "name": "Name",
                    "value": {
                        "id": "7fe052fa54d06f39a0b17d9c[name]",
                        "name": "Name",
                        "value": ""
                    }
                }
            },
            "type": "Story Transition"
        },
        "ccc02c05649dcd4955d16a44": {
            "label": {
                "id": "ccc02c05649dcd4955d16a44[label]",
                "name": "Label",
                "value": {
                    "id": "ccc02c05649dcd4955d16a44[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "e1bdc5af1901d104ababffed",
            "target": "e1bdc5af1901d104ababffed",
            "attributes": {},
            "type": "View Connection"
        },
        "b66764e92a353e46af40b2d0": {
            "label": {
                "id": "b66764e92a353e46af40b2d0[label]",
                "name": "Label",
                "value": {
                    "id": "b66764e92a353e46af40b2d0[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "e1bdc5af1901d104ababffed",
            "target": "c1bbcac647567a945b738ff3",
            "attributes": {},
            "type": "View Connection"
        },
        "d7c5ff1b9cda4a8a892d739e": {
            "label": {
                "id": "d7c5ff1b9cda4a8a892d739e[label]",
                "name": "Label",
                "value": {
                    "id": "d7c5ff1b9cda4a8a892d739e[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "50c0ecdd203328b88afba26d",
            "target": "aec1fbd12b04a330440d5bd2",
            "attributes": {},
            "type": "BME split"
        },
        "c99a875bfe037066abea1691": {
            "label": {
                "id": "c99a875bfe037066abea1691[label]",
                "name": "Label",
                "value": {
                    "id": "c99a875bfe037066abea1691[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "50c0ecdd203328b88afba26d",
            "target": "d12ce79294533cb9f6958b26",
            "attributes": {},
            "type": "BME split"
        },
        "0ea34d47745de909e259345e": {
            "label": {
                "id": "0ea34d47745de909e259345e[label]",
                "name": "Label",
                "value": {
                    "id": "0ea34d47745de909e259345e[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "50c0ecdd203328b88afba26d",
            "target": "0629e54e10e0c0002f5ec502",
            "attributes": {},
            "type": "BME split"
        },
        "7b17ae7d7baf3766ed099462": {
            "label": {
                "id": "7b17ae7d7baf3766ed099462[label]",
                "name": "Label",
                "value": {
                    "id": "7b17ae7d7baf3766ed099462[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "9d8e0e4187672c4da03f46fd",
            "target": "574d27e34b719a6cc29c3140",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "7b17ae7d7baf3766ed099462[name]",
                    "name": "Name",
                    "value": {
                        "id": "7b17ae7d7baf3766ed099462[name]",
                        "name": "Name",
                        "value": ""
                    }
                }
            },
            "type": "Story Transition"
        },
        "cd23578db8bd126e622fa3a0": {
            "label": {
                "id": "cd23578db8bd126e622fa3a0[label]",
                "name": "Label",
                "value": {
                    "id": "cd23578db8bd126e622fa3a0[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "574d27e34b719a6cc29c3140",
            "target": "c97bc2a9d1e23e1c04aabc48",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "cd23578db8bd126e622fa3a0[name]",
                    "name": "Name",
                    "value": {
                        "id": "cd23578db8bd126e622fa3a0[name]",
                        "name": "Name",
                        "value": ""
                    }
                }
            },
            "type": "Story Transition"
        },
        "f867d8ea9aff22fb493da28b": {
            "label": {
                "id": "f867d8ea9aff22fb493da28b[label]",
                "name": "Label",
                "value": {
                    "id": "f867d8ea9aff22fb493da28b[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c1bbcac647567a945b738ff3",
            "target": "9d8e0e4187672c4da03f46fd",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "f867d8ea9aff22fb493da28b[name]",
                    "name": "Name",
                    "value": {
                        "id": "f867d8ea9aff22fb493da28b[name]",
                        "name": "Name",
                        "value": ""
                    }
                }
            },
            "type": "Story Transition"
        },
        "36025eef869853ca4668b8c8": {
            "label": {
                "id": "36025eef869853ca4668b8c8[label]",
                "name": "Label",
                "value": {
                    "id": "36025eef869853ca4668b8c8[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c97bc2a9d1e23e1c04aabc48",
            "target": "c1bbcac647567a945b738ff3",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "36025eef869853ca4668b8c8[name]",
                    "name": "Name",
                    "value": {
                        "id": "36025eef869853ca4668b8c8[name]",
                        "name": "Name",
                        "value": ""
                    }
                }
            },
            "type": "Story Transition"
        },
        "0073b20a63c248dfabca7e7b": {
            "label": {
                "id": "0073b20a63c248dfabca7e7b[label]",
                "name": "Label",
                "value": {
                    "id": "0073b20a63c248dfabca7e7b[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "aec1fbd12b04a330440d5bd2",
            "target": "9d8e0e4187672c4da03f46fd",
            "attributes": {},
            "type": "Media Connection"
        },
        "fa5f233383805608da787179": {
            "label": {
                "id": "fa5f233383805608da787179[label]",
                "name": "Label",
                "value": {
                    "id": "fa5f233383805608da787179[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "d12ce79294533cb9f6958b26",
            "target": "574d27e34b719a6cc29c3140",
            "attributes": {},
            "type": "Media Connection"
        },
        "5576a4892a1dc197e242a99b": {
            "label": {
                "id": "5576a4892a1dc197e242a99b[label]",
                "name": "Label",
                "value": {
                    "id": "5576a4892a1dc197e242a99b[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "0629e54e10e0c0002f5ec502",
            "target": "c97bc2a9d1e23e1c04aabc48",
            "attributes": {},
            "type": "Media Connection"
        },
        "1e3990e7f4a50be8cc373a64": {
            "label": {
                "id": "1e3990e7f4a50be8cc373a64[label]",
                "name": "Label",
                "value": {
                    "id": "1e3990e7f4a50be8cc373a64[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c97bc2a9d1e23e1c04aabc48",
            "target": "f98a8b07c61afc4b810c0a88",
            "attributes": {},
            "type": "View Connection"
        },
        "259235bd59cdc1264bd6fefe": {
            "label": {
                "id": "259235bd59cdc1264bd6fefe[label]",
                "name": "Label",
                "value": {
                    "id": "259235bd59cdc1264bd6fefe[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c97bc2a9d1e23e1c04aabc48",
            "target": "9dc54660417db048d93f1b95",
            "attributes": {},
            "type": "Tag Connection"
        },
        "7b9887338d6bbb87f6267078": {
            "label": {
                "id": "7b9887338d6bbb87f6267078[label]",
                "name": "Label",
                "value": {
                    "id": "7b9887338d6bbb87f6267078[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c97bc2a9d1e23e1c04aabc48",
            "target": "108fc0c124e121cce80d3a2b",
            "attributes": {},
            "type": "Tag Connection"
        },
        "615ec52bcc12631d4242581b": {
            "label": {
                "id": "615ec52bcc12631d4242581b[label]",
                "name": "Label",
                "value": {
                    "id": "615ec52bcc12631d4242581b[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "2cdb917e7f2462ad38785268",
            "target": "50c0ecdd203328b88afba26d",
            "attributes": {},
            "type": "BME -> SU"
        },
        "e313198cddd84ba4b35174d8": {
            "label": {
                "id": "e313198cddd84ba4b35174d8[label]",
                "name": "Label",
                "value": {
                    "id": "e313198cddd84ba4b35174d8[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "9d8e0e4187672c4da03f46fd",
            "target": "5c82a0cefbd77924359f978e",
            "attributes": {},
            "type": "View Connection"
        },
        "c0d675fd241dbb9cb3f0b319": {
            "label": {
                "id": "c0d675fd241dbb9cb3f0b319[label]",
                "name": "Label",
                "value": {
                    "id": "c0d675fd241dbb9cb3f0b319[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "9d8e0e4187672c4da03f46fd",
            "target": "f5ca5860adfd2245277cca7c",
            "attributes": {},
            "type": "Tag Connection"
        },
        "f14b25afa0bfb2a414ed65c4": {
            "label": {
                "id": "f14b25afa0bfb2a414ed65c4[label]",
                "name": "Label",
                "value": {
                    "id": "f14b25afa0bfb2a414ed65c4[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "574d27e34b719a6cc29c3140",
            "target": "1b96cf7859948316278d84e4",
            "attributes": {},
            "type": "Tag Connection"
        },
        "9643ecf899e288557f457419": {
            "label": {
                "id": "9643ecf899e288557f457419[label]",
                "name": "Label",
                "value": {
                    "id": "9643ecf899e288557f457419[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "4073e2e3f5aed773bf778883",
            "target": "b7e41e042ecd6734efc5dc05",
            "attributes": {},
            "type": "BME split"
        },
        "f1de4958e905120657bd92f9": {
            "label": {
                "id": "f1de4958e905120657bd92f9[label]",
                "name": "Label",
                "value": {
                    "id": "f1de4958e905120657bd92f9[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "4073e2e3f5aed773bf778883",
            "target": "60ddd111c83f765f48ee8fbc",
            "attributes": {},
            "type": "BME split"
        },
        "7c8c26858276e36f3589c1e3": {
            "label": {
                "id": "7c8c26858276e36f3589c1e3[label]",
                "name": "Label",
                "value": {
                    "id": "7c8c26858276e36f3589c1e3[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "4073e2e3f5aed773bf778883",
            "target": "3998e470677c1df40b3fe51c",
            "attributes": {},
            "type": "BME split"
        },
        "165a8fed365affd5c8c7cfa9": {
            "label": {
                "id": "165a8fed365affd5c8c7cfa9[label]",
                "name": "Label",
                "value": {
                    "id": "165a8fed365affd5c8c7cfa9[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "c1bbcac647567a945b738ff3",
            "target": "3b04a992977a28acf2c00dd1",
            "attributes": {
                "520dc699e4c2754c2ef50565": {
                    "id": "165a8fed365affd5c8c7cfa9[name]",
                    "name": "Name",
                    "value": {
                        "id": "165a8fed365affd5c8c7cfa9[name]",
                        "name": "Name",
                        "value": "Learn the chords"
                    }
                }
            },
            "type": "Story Transition"
        },
        "3387efcd2d88360e71e315b5": {
            "label": {
                "id": "3387efcd2d88360e71e315b5[label]",
                "name": "Label",
                "value": {
                    "id": "3387efcd2d88360e71e315b5[label]",
                    "name": "Label",
                    "value": ""
                }
            },
            "source": "b7e41e042ecd6734efc5dc05",
            "target": "3b04a992977a28acf2c00dd1",
            "attributes": {},
            "type": "Media Connection"
        }
    }
}
