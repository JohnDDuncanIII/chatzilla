// vim: sw=2:et

plugin.id = "channel-tree";

plugin.init = function(glob) {
  plugin.major = 1;
  plugin.minor = 0;
  plugin.version = plugin.major + "." + plugin.minor + " (10 Jun 2008)";
  plugin.description = "List tabs in a tree";

  plugin.hooks = [];
  plugin.tags = [];
  plugin.nodes = [];

  return "OK";
}

plugin.enable = function() {
  var stylesheet = document.createProcessingInstruction("xml-stylesheet",
    'href="' + plugin.cwd + 'style.css"');
  document.insertBefore(stylesheet, document.firstChild);

  var splitter = document.createElement("splitter");
  var grippy = document.createElement("grippy");
  splitter.setAttribute("collapse", "before");
  splitter.setAttribute("id", "splitter[" + plugin.id + "]");
  splitter.setAttribute("persist", "collapsed left");
  splitter.appendChild(grippy);

  var tree = document.createElement("tree");
  tree.setAttribute("id", "channel-tree");
  tree.setAttribute("hidecolumnpicker", "true");
  tree.setAttribute("seltype", "single");
  tree.setAttribute("width", "166");
  plugin.tree = tree;

  var treeCols = document.createElement("treecols");
  var treeCol = document.createElement("treecol");
  treeCol.setAttribute("flex", "1");
  treeCol.setAttribute("primary", "true");
  treeCol.setAttribute("hideheader", "true");

  tree.appendChild(treeCols);
  treeCols.appendChild(treeCol);

  var treeChildren = document.createElement("treechildren");
  tree.appendChild(treeChildren);
  plugin.treeChildrenNode = treeChildren;

  var box = document.getElementById("tabpanels-contents-box");
  plugin.insertNode(splitter, box, box.firstChild);
  plugin.insertNode(tree, box, box.firstChild);
  plugin.treeView = tree.view;

  // add existing tabs into tree
  client.viewsArray.forEach(function(v) {
    plugin.handleNewView(v.source);
  });
  tree.treeBoxObject.clearStyleAndImageCaches();

  plugin.addHook("create-tab-for-view",
    function(e) {
      var o = e.view;
      plugin.handleNewView(o);
    }, false);

  plugin.addHook("delete-view",
    function(e) {
      var o = e.view
      var p = plugin.getTreeParent(o);
      if(!o.treeItemNode) return;
      // only delete from tree when o is a child node or it has no children
      if(plugin.hasNoChildrenInTree(o)) {
        o.treeItemNode.parentNode.removeChild(o.treeItemNode);
        delete o.treeItemNode;
        if("childrenNode" in o) delete o.treeChildrenNode;
      }
    }, false);

  plugin.addHook("set-current-view",
    function(e) {
      var o = e.view;
      plugin.handleNewView(o);
      plugin.setCurrentView(o);
    }, false);

  // switch view when tree item is selected
  tree.addEventListener("select",
    function(e) {
      selectedObject = plugin.objectSelectedInTree();
      // recreate view when it is closed, this happens for network tabs
      if(!("messages" in selectedObject)) {
        client.dispatch("create-tab-for-view", {view: selectedObject});
      }
      client.dispatch("set-current-view", {view: selectedObject});
      setTimeout('dispatch("focus-input")', 0);
    }, false);

  // duplicate context menu of corresponding tabs to tree item
  plugin.contextId = "context:" + plugin.id;
  client.menuSpecs[plugin.contextId] = {
    getContext: function(cx) {
      if(!cx) cx = new Object();
      cx.__proto__ = getObjectDetails(plugin.objectSelectedInTree());
      return cx;
    },
    items: client.menuSpecs["context:tab"].items}
  tree.setAttribute("context", plugin.contextId);
  client.updateMenus();

  // decorate setTabState function to make it update property on tree item
  plugin.originalSetTabState = setTabState;
  setTabState = function(source, what, callback) {
    plugin.handleNewView(source);
    plugin.originalSetTabState(source, what, callback);

    // following block copied from static.js lines 2696-2718 function setTabState
    if (typeof source != "object")
    {
      if (!ASSERT(source in client.viewsArray,
          "INVALID SOURCE passed to setTabState"))
      return;
      source = client.viewsArray[source].source;
    }

    plugin.syncStateForObject(source);
  }

  return true;
}

plugin.disable = function() {
  setTabState = plugin.originalSetTabState;
  plugin.hooks.forEach(function(hook) {
    client.commandManager.removeHook(hook.name, hook.id, hook.before);
  });
  plugin.tags.forEach(function(tag) {
    delete tag.object[tag.name];
  });
  plugin.nodes.forEach(function(node) {
    if(node.parentNode) {
      node.parentNode.removeChild(node);
    }
  });
  delete client.menuSpecs[plugin.contextId];
  client.updateMenus();
  return true;
}

// --- home made "garbage collecting" helpers ---

// add a hook and remember it so it's automatically removed on disable
plugin.addHook = function(name, callback, before) {
  var id = plugin.id + "-" + name;
  plugin.hooks.push({"name": name, "id": id, "before": before});
  client.commandManager.addHook(name, callback, id, before);
}

// tag a property onto an object. at disable all these tags are automatically
// removed
plugin.tagObject = function(o, name, value) {
  o[name] = value;
  if(! plugin.tags.some(function(i) {return i.o == o && i.name == name;}) ) {
    plugin.tags.push({object: o, name: name});
  }
}

// add a node in the DOM. it must have an ID and any existing node with the same ID
// is removed (to clean up left overs from crashed plugin). at disable the node is
// removed
plugin.insertNode = function(node, under, before) {
  var existing;
  var id = node.getAttribute("id");
  while(existing = document.getElementById(id)) {
    existing.parentNode.removeChild(existing);
  }
  under.insertBefore(node, before);
  plugin.nodes.push(node);
}

// --- helpers for maintaining representation of views in the tree ---

// if o has not been encountered, add to tree, otherwise do nothing
plugin.handleNewView = function(o) {
  if(!o || !(o instanceof Object) || ("treeItemNode" in o)) return;
  var parent = plugin.getTreeParent(o);
  if(parent) {
    plugin.handleNewView(parent);
    plugin.addToTree(o, parent.treeChildrenNode);
  } else {
    plugin.addToTreeAsParent(o);
  }
}

// add an entry to the tree for the object, under the treerows node specified by "at"
plugin.addToTree = function(o, at) {
  var id = plugin.getIdForObject(o);
  var treeItem = document.getElementById(id);
  if(!treeItem) {
    // add to tree
    treeItem = document.createElement("treeitem");
    treeItem.setAttribute("id", id);
    var treeRow = document.createElement("treerow");
    var treeCell = document.createElement("treecell");
    treeCell.setAttribute("label", plugin.getLabelForObject(o));

    treeItem.appendChild(treeRow);
    treeRow.appendChild(treeCell);

    at.appendChild(treeItem);
  }
  // if the tree item is already there, associate it with the object
  plugin.tagObject(o, "treeItemNode", treeItem);
  plugin.tagObject(treeItem, "object", o);
  plugin.syncStateForObject(o);
  plugin.editPropertiesForObject(o, [], [o.TYPE]);
  return treeItem;
}

// add an entry to the tree for the object, at top level, and mark it as a container
// o.treeChildrenNode is set to the treerows under the added object, where children can be added
plugin.addToTreeAsParent = function(o) {
  var treeItem = plugin.addToTree(o, plugin.treeChildrenNode);
  treeItem.setAttribute("container", "true");
  treeItem.setAttribute("open", "true");
  var treeChildrenId = treeItem.getAttribute("id") + "-treechildren";
  var treeChildren = document.getElementById(treeChildrenId);
  if(!treeChildren) {
    treeChildren = document.createElement("treechildren");
    treeChildren.setAttribute("id", treeChildrenId);
  }
  treeItem.appendChild(treeChildren);
  plugin.tagObject(o, "treeChildrenNode", treeChildren);
  return treeItem;
}

// returns true if the object's tree item has no child
plugin.hasNoChildrenInTree = function(o) {
  var treeChildrenNode = o.treeChildrenNode;
  return !treeChildrenNode || !treeChildrenNode.hasChildNodes();
}

plugin.viewStates = ["normal",
                     "superfluous",
                     "activity",
                     "attention",
                     "channel-tree-current"];
// set property for the treecell most directly under the given treeItemNode
plugin.setStateForObject = function(o, state) {
  plugin.editPropertiesForObject(o, plugin.viewStates, [state]);
}

plugin.editPropertiesForObject = function(o, toRemove, toAdd) {
  var treeItem = o.treeItemNode;
  var treeRow = treeItem.firstChild;
  var treeCell = treeRow.firstChild;
  [treeItem, treeRow, treeCell].forEach(function(node) {
    var originalProperties = node.getAttribute("properties");
    var properties = originalProperties.split(/\s+/);
    properties = properties.filter(function(prop) {
      return toRemove.indexOf(prop) == -1;
    });
    toAdd.forEach(function(prop) {
      properties.push(toAdd);
    });
    var newProperties = properties.join(" ");
    node.setAttribute("properties", newProperties);
  });
}

// return parent of an object, in a definition consistent to the tree structure
// IRCNetwork and IRCDCC objects are considered top level
plugin.getTreeParent = function(o) {
  // memoized result
  if("treeParent" in o) return o.treeParent;
  // objects treated as top level, this line might not be necessary
  if("IRCNetwork" == o.TYPE) return undefined;

  var parent = o.parent;
  // skip IRCServer and IRCDCC objects and use the network or *client* as parent
  if(parent && ["IRCServer", "IRCDCC"].indexOf(parent.TYPE) >= 0)
    parent = parent.parent;

  // memoize the result in o.treeParent;
  plugin.tagObject(o, "treeParent", parent);
  return parent;
}

plugin.objectSelectedInTree = function() {
  return plugin.treeView.getItemAtIndex(plugin.tree.currentIndex).object;
}

plugin.setCurrentView = function(o) {
  var index = plugin.treeView.getIndexOfItem(o.treeItemNode);
  plugin.treeView.selection.select(index);
  plugin.syncStateForObject(o);
  var lastCurrentObject = plugin.lastCurrentObject;
  if(lastCurrentObject && lastCurrentObject != o) {
    plugin.syncStateForObject(lastCurrentObject);
  }
  plugin.tagObject(plugin, "lastCurrentObject", o);
}

plugin.syncStateForObject = function(o) {
  var tb = getTabForObject(o, true);

  // copy the just set state on tb to treeItemNode's property
  state = tb.getAttribute("state");
  // we use the property "channel-tree-current" instead of "current", because the
  // latter is used by XUL. although in practice the two should have the same
  // effect
  if(state == "current") {
    state = "channel-tree-current";
  }
  plugin.setStateForObject(o, state);
}

// return an unique and consistent ID for the treeitem for the object based on its
// unicodeName and that of its parent. the format is "treeitem[parent][name]", and
// for top level nodes it's "treeitem[][name]"
plugin.getIdForObject = function(o) {
  var p = plugin.getTreeParent(o);
  var parentName = p ? plugin.getLabelForObject(p) : "";
  return "treeitem-" + parentName + "-" + plugin.getLabelForObject(o);
}

plugin.getLabelForObject = function(o) {
  return getTabForObject(o, true).getAttribute("label");
}
