import { readNewick } from "./newickAdapter";

export class TreeNode {
  // TreeNode (Tree) class is used to store a tree structure. A tree
  // consists of a collection of TreeNode instances connected in a
  // hierarchical way. Trees can be loaded from the New Hampshire Newick
  // format (newick).

  children: Array<TreeNode>; // direct descendents of this node
  up: TreeNode | null; // parent node
  dist: number; // distance from the node to its parents (branchlength)
  support: number; // support value of the node
  name: string;
  features: { [key: string]: any };

  constructor(
    newick = null,
    format = 0,
    dist = null,
    support = null,
    name = null,
    quoted_node_names = false,
    features = {}
  ) {
    /*
 :argument newick: Path to the file containing the tree or, alternatively,
    the text string containing the same information.
 :argument 0 format: subnewick format
   .. table::
       ======  ==============================================
       FORMAT  DESCRIPTION
       ======  ==============================================
       0        flexible with support values
       1        flexible with internal node names
       2        all branches + leaf names + internal supports
       3        all branches + all names
       4        leaf branches + leaf names
       5        internal and leaf branches + leaf names
       6        internal branches + leaf names
       7        leaf branches + all names
       8        all names
       9        leaf names
       100      topology only
       ======  ==============================================
 :returns: a tree node object which represents the base of the tree.
 **Examples:**
 ::
     t1 = Tree() # creates an empty tree
     t2 = Tree('(A:1,(B:1,(C:1,D:1):0.5):0.5);')
     t3 = Tree('/home/user/myNewickFile.txt')
  */

    this.children = [];
    this.up = null;
    this.dist = dist ? dist : 1.0;
    this.support = support ? support : 1.0;
    this.name = name ? name : "NoName";

    if (newick) {
      readNewick(newick, this, format, quoted_node_names);
    }
  }

  #getDist() {
    return this.dist;
  }
  #setDist(dist) {
    try {
      this.dist = parseFloat(dist);
    } catch (error) {
      throw "Error: node dist must be a float number";
    }
  }

  #getSupport() {
    return this.support;
  }
  #setSupport(support) {
    try {
      this.support = parseFloat(support);
    } catch (error) {
      throw "Error: node support must be a float number";
    }
  }

  #getUp() {
    return this.up;
  }
  #setUp(up) {
    if (up instanceof TreeNode || up === null) {
      this.up = up;
    } else {
      throw "Error: node up must be a TreeNode or null";
    }
  }

  #getChildren() {
    return this.children;
  }
  #setChildren(children) {
    if (
      children instanceof Array &&
      children.every((child) => child instanceof TreeNode)
    ) {
      this.children = children;
    } else {
      throw "Error: node children must be an Array";
    }
  }

  addFeature(name, value) {
    /*
 :argument name: name of the feature
 :argument value: value of the feature
 :returns: None
 **Examples:**
 ::
     t = Tree('(A:1,(B:1,(C:1,D:1):0.5):0.5);')
     t.add_feature('name', 'tree1')
     t.add_feature('color', 'red')
  */
    this[name] = value;
    this.features[name] = value;
  }

  addFeatures(features) {
    for (const [key, value] of Object.entries(features)) {
      this.addFeature(key, value);
    }
  }

  delFeature(name) {
    /*
 :argument name: name of the feature
 :returns: None
 **Examples:**
 ::
     t = Tree('(A:1,(B:1,(C:1,D:1):0.5):0.5);')
     t.add_feature('name', 'tree1')
     t.add_feature('color', 'red')
     t.del_feature('color')
  */
    this[name] = undefined;
    delete this.features[name];
  }
}
// class Tree is an alias for TreeNode
export class Tree extends TreeNode {}
