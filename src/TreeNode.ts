import { filter, find } from "lodash";
import { DEFAULT_DIST, DEFAULT_COMPACT, DEFAULT_NAME, DEFAULT_SHOWINTERNAL, DEFAULT_SUPPORT } from "./constants";
import { setIntersection } from "./helperFunctions";
import { readNewick } from "./newickAdapter";
import {TreeError} from "./TreeError";
import { _translateNodes } from "./helperFunctions";

// TreeNode (Tree) class is used to store a tree structure. A tree
// consists of a collection of TreeNode instances connected in a
// hierarchical way. Trees can be loaded from the New Hampshire Newick
// format (newick).
export class TreeNode {
  /** ATTRIBUTES **/
  children: Array<TreeNode>; // direct descendents of this node
  up: TreeNode | null; // parent node
  dist: number; // distance from the node to its parents (branchlength)
  support: number; // support value of the node
  name: string;
  features: { [key: string]: any };


/*
  :argument newick: Path to the file containing the tree or, alternatively,
      the text string containing the same information.
  :argument format: subnewick format
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
  constructor(
    newick = null,
    format = 0,
    dist = DEFAULT_DIST,
    support = DEFAULT_SUPPORT,
    name = DEFAULT_NAME,
    quoted_node_names = false,
    features = {}
  ) {

    this.children = [];
    this.up = null;
    this.dist = dist ? dist : 1.0;
    this.support = support ? support : 1.0;
    this.name = name ? name : DEFAULTNAME;

    if (newick) {
      readNewick(newick, this, format, quotedNodeNames);
    }
  }

  /***************************/
  /** DUNDER METHODS **/
  /***************************/

  /**
   * This allows to execute tree.and('A') to obtain the descendant node
   * whose name is "A".
   */
  and(value) {
    try {
      //TODO: make sure this works with however we end up implementing itersearchnodes
      const firstMatch = this.iterSearchNodes({ name: value })
      return firstMatch;
    } catch (error) {
      throw new TreeError("Node not found");
    }
  }

  /**
   * This allows us to sum two trees => new TreeNode root, which has each of the original trees' roots as its two children.
   */
  add(value) {
    if (value instanceof TreeNode) {
      const newRoot = new TreeNode();
      newRoot.addChild(this);
      newRoot.addChild(value);
      return newRoot;
    } else {
      throw new TreeError("Invalid node type");
    }
  }

  /**
   * Print tree in newick format.
   */
  toString(compact=DEFAULT_COMPACT, show_internal=DEFAULT_SHOWINTERNAL) {
    return this.getAscii(
      compact, show_internal
    );
  }

  /**
   * Check if item belongs to this node. The 'item' argument must be a TreeNode instance or its
   * associated name.
   */
  contains(item) {
    if (item instanceof TreeNode) {
      //TODO: originally this checked if the new item was in a Set() of the descendents. I don't think that should be necessary given how getDescendents() works, but should check this.
      return this.getDescendants().includes(item);
    } else if (typeof item === "string") {
      return this.traverse().map((n: TreeNode) => n.name).includes(item);
    }
  }

  /**
   * Node len returns number of children.
   */
  length() {
      return this.getLeaves().length ?? 0;
  }

  /**
   *Iterator over leaf nodes
    */
  iterate() {
      return this.iterLeaves();
  }


  /** PRIVATE METHODS **/
  _getDist() {
    return this.dist;
  }
  _setDist(dist) {
    try {
      this.dist = parseFloat(dist);
    } catch (error) {
      throw new TreeError("Error: node dist must be a float number");
    }
  }

  _getSupport() {
    return this.support;
  }
  _setSupport(support) {
    try {
      this.support = parseFloat(support);
    } catch (error) {
      throw new TreeError("Error: node support must be a float number");
    }
  }

  _getUp() {
    return this.up;
  }
  _setUp(up) {
    if (up instanceof TreeNode || up === null) {
      this.up = up;
    } else {
      throw new TreeError("Error: node up must be a TreeNode or null");
    }
  }

  _getChildren() {
    return this.children;
  }
  _setChildren(children) {
    if (
      children instanceof Array &&
      children.every((child) => child instanceof TreeNode)
    ) {
      this.children = children;
    } else {
      throw new TreeError("Error: node children must be an Array");
    }
  }

/***************************/
/** TOPOLOGY MANAGEMENT */
/***************************/

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
  addFeature(name, value) {
    this[name] = value;
    this.features[name] = value;
  }

  addFeatures(features) {
    for (const [key, value] of Object.entries(features)) {
      this.addFeature(key, value);
    }
  }

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
  delFeature(name) {
    this[name] = undefined;
    delete this.features[name];
  }

  /*
:argument child: a TreeNode instance
:returns: the child node instance
**Examples:**
::
   t = Tree('(A:1,(B:1,(C:1,D:1):0.5):0.5);')
   t.add_child(TreeNode('E:1'))
*/
  addChild(child?, name?, dist?, support?) {

    if (!child || !(child instanceof TreeNode)) {
      child = new TreeNode();
    }

    child.up = this;
    child.name = name ? name : child.name;
    child.dist = dist ? dist : child.dist;
    child.support = support ? support : child.support;
    this.children.push(child);
    return child;
  }

  /*
:argument child: a TreeNode instance
:returns: child (with parent set to null)
**Examples:**
::
   t = Tree('(A:1,(B:1,(C:1,D:1):0.5):0.5);')
   t.remove_child(t.children[0])
*/
  removeChild(child) {
    const childIndex = this.children.indexOf(child);
    if (childIndex > -1) {
      delete this.children[childIndex];
      child.up = null;
      return child;
    } else {
      throw new TreeError("Error: child not found");
    }
  }

  /*
:argument sister: a TreeNode instance
:returns: the sister node instance
*/
  addSister(sister?, name?, dist?) {
    if (this.up === null) {
      throw new TreeError("Error: A parent node is required to add a sister");
    } else {
      return this.up.addChild(sister, name, dist);
    }
  }

  /*
      Removes a sister node. It has the same effect as
      **`TreeNode.up.remove_child(sister)`**
      If a sister node is not supplied, the first sister will be deleted
      and returned.
      :argument sister: A node instance
      :return: The node removed
*/
  remove_sister(sister) {
    if (this.up === null) {
      throw "Error: A parent node is required to remove a sister";
    }

    const sisters = this.getSisters();
    if (sisters.length > 0) {
      if (!sister) {
        return sisters.shift();
      } else {
        return this.up.removeChild(sister);
      }
    }
  }

  /*
      Deletes node from the tree structure. Notice that this method
      makes 'disappear' the node from the tree structure. This means
      that children from the deleted node are transferred to the
      next available parent.
      :param True prevent_nondicotomic: When True (default), delete
          function will be execute recursively to prevent
          single-child nodes.
      :param False preserve_branch_length: If True, branch lengths
          of the deleted nodes are transferred (summed up) to its
          parent's branch, thus keeping original distances among
          nodes.
      **Example:**
      ::
              / C
        root-|
             |        / B
              \--- H |
                      \ A
        > H.delete() will produce this structure:
              / C
             |
        root-|--B
             |
              \ A
*/
  delete(prevent_nondicotomic = true, preserve_branch_length = false) {

    const parent = this.up;

    if (parent) {
      if (preserveBranchLength) {
        if (this.children.length === 1) {
          this.children[0].dist += this.dist;
        } else if (this.children.length > 1) {
          parent.dist += this.dist;
        }
      }

      const children = this.children;
      children.forEach((child: TreeNode) => {
        parent.addChild(child);
      });

      parent.removeChild(this);
    }

    if (preventNondicotomic && parent && parent.children.length < 2) {
      parent.delete(preventNondicotomic, preserveBranchLength);
    }
  }

  /*Detachs this node (and all its descendants) from its parent
  and returns the referent to itself.
  Detached node conserves all its structure of descendants, and can
  be attached to another node through the 'add_child' function. This
  mechanism can be seen as a cut and paste.*/
  detach() {
    if (this.up) {
      this.up.removeChild(this);
    }

    this.up = null;
    return this;
  }

  /**Prunes the topology of a node to conserve only the selected list of leaf
    nodes. The minimum number of nodes that conserve the
    topological relationships among the requested nodes will be
    retained. Root node is always conserved.
    :var nodes: a list of node names or node objects that should be retained
    :param preserve_branch_length (default: False): If True, branch lengths
      of the deleted nodes are transferred (summed up) to its
      parent's branch, thus keeping original distances among
      nodes.
    **Examples:**
    ::
      t1 = Tree('(((((A,B)C)D,E)F,G)H,(I,J)K)root;', format=1)
      t1.prune(['A', 'B'])
      #                /-A
      #          /D /C|
      #       /F|      \-B
      #      |  |
      #    /H|   \-E
      #   |  |                        /-A
      #-root  \-G                 -root
      #   |                           \-B
      #   |   /-I
      #    \K|
      #       \-J
      t1 = Tree('(((((A,B)C)D,E)F,G)H,(I,J)K)root;', format=1)
      t1.prune(['A', 'B', 'C'])
      #                /-A
      #          /D /C|
      #       /F|      \-B
      #      |  |
      #    /H|   \-E
      #   |  |                              /-A
      #-root  \-G                  -root- C|
      #   |                                 \-B
      #   |   /-I
      #    \K|
      #       \-J
      t1 = Tree('(((((A,B)C)D,E)F,G)H,(I,J)K)root;', format=1)
      t1.prune(['A', 'B', 'I'])
      #                /-A
      #          /D /C|
      #       /F|      \-B
      #      |  |
      #    /H|   \-E                    /-I
      #   |  |                      -root
      #-root  \-G                      |   /-A
      #   |                             \C|
      #   |   /-I                          \-B
      #    \K|
      #       \-J
      t1 = Tree('(((((A,B)C)D,E)F,G)H,(I,J)K)root;', format=1)
      t1.prune(['A', 'B', 'F', 'H'])
      #                /-A
      #          /D /C|
      #       /F|      \-B
      #      |  |
      #    /H|   \-E
      #   |  |                              /-A
      #-root  \-G                -root-H /F|
      #   |                                 \-B
      #   |   /-I
      #    \K|
      #       \-J
    */
  // prune(toKeep: Array<string | TreeNode>, preserve_branch_length: boolean =false) {
  //   // convert any node names to TreeNode objects
  //   let nodesToKeep: TreeNode[] = _translateNodes(this, toKeep)
  //   // always retain the root
  //   nodesToKeep.push(this)

  //   //TODO: make sure we ended up returning arguments in this format
  //   const {mrca, nodeToPath} = this.getCommonAncestor(toKeep, true)
  //   const nodeNameToDepth: {[key: string] : number} = {};
  //   const nodeNameToTargets: {[key: string] : TreeNode[]} = {};
  //   // const nameToNode: {key: string, value: TreeNode} = {};

  //   // Calculate which nodesToKeep are visiting the same internal "path" nodes en route to the mrca
  //   Object.entries(nodeToPath).forEach(([nodeName, path]) => {
  //     path.forEach((pathNode: TreeNode) => {
  //       if (!Object.keys(nodeNameToDepth).includes(pathNode.name)) {
  //         const depth = pathNode.getDistance(mrca, true)
  //         nodeNameToDepth[pathNode.name] = depth
  //       }
  //       if (!Object.keys(nodeNameToTargets).includes(pathNode.name)) {
  //         nodeNameToTargets[pathNode.name] = []
  //       }
  //       if (!(nodeName === pathNode.name)) {
  //         nodeNameToTargets[pathNode.name].push(nodeName)
  //       }
  //   })
  // })

  // // if several internal nodes are in the path of exactly the same kept
  // // nodes, only one (the deepest) should be maintained.
  // const compareNodeDepth = (x, y) => {
  //   if (nodeNameToDepth[x] > nodeNameToDepth[y]) {
  //     return -1;
  //   } else if (nodeNameToDepth[x] < nodeNameToDepth[y]) {
  //     return 1;
  //   } else {
  //     return 0;
  //   }
  // }

  // this.getDescendents('postorder').forEach((node: TreeNode) => {
  //   if (!nodesToKeep.includes(node)) {
  //     if (preserve_branch_length) {
  //       if (node.children.length === 1) {
  //         node.children[0].dist += n.dist
  //       } else if (node.children.length > 1 && node.up) {
  //         node.up.dist += node.dist
  //     }
  //   }
  //   node.delete(true)
  // }
  //   })

  //   // TODO: missing some ending brace here somewhere
  // }

  // Reverses the current children order
  swapChildren() {
    if (this.children.length > 1) {
      this.children.reverse()
    }
  }

  /******************
   * Tree traversal *
   *****************/

  /**
   * Returns an independent list of node's children.
   */
  getChildren() {
    return [...this.children];
  }

  /**
   * Returns an independent list of sister nodes.
   */
  getSisters() {
    if (this.up) {
      return filter(this.up.children, (ch) => ch !== this);
    } else {
      return [];
    }
  }

  /**
   * Returns an iterator over the leaves under this node.
   * :argument None isLeafFn: See :func:`TreeNode.traverse` for
   * documentation.
   */
  iterLeaves(this, isLeafFn) {
    for n in this.traverse(strategy = "preorder", isLeafFn):
      if not isLeafFn:
        if n.isLeaf():
          yield n
      else:
        if isLeafFn(n):
          yield n
  }

  /**
    Returns the list of terminal nodes (leaves) under this node.
    :argument None isLeafFn: See :func:`TreeNode.traverse` for
    documentation.
  */
  getLeaves(isLeafFn) {
    return [...this.iterLeaves({ isLeafFn })];
  }

  /**
   * Returns an iterator over the leaf names under this node.
   *:argument None isLeafFn: See :func:`TreeNode.traverse` for
  * documentation.
  */
  iterLeafNames(isLeafFn) {
    for n in this.iterLeaves({ isLeafFn }):
      yield n.name
  }

  /**
   * Returns the list of terminal node names under the current node.
   * :argument None isLeafFn: See :func:`TreeNode.traverse` for
   * documentation.
   */
  getLeafNames(isLeafFn) {
    return [...this.iterLeafNames({ isLeafFn })];
  }

  /**
   * Returns an iterator over all descendant nodes.
   * :argument None isLeafFn: See :func:`TreeNode.traverse` for
   * documentation.
   */
  iterDescendants(strategy = "levelorder", isLeafFn) {
    for n in this.traverse(strategy, isLeafFn):
      if n is not this:
        yield n
  }

  /**
   * Returns a list of all (leaves and internal) descendant nodes.
   * :argument None isLeafFn: See :func:`TreeNode.traverse` for
   * documentation.
   */
  getDescendants(strategy = "levelorder", isLeafFn) {
    return [...this.iterDescendants(strategy, isLeafFn)];
  }

  /**
   * Returns an iterator to traverse the tree structure under this node.
    :argument "levelorder" strategy: set the way in which tree
        will be traversed. Possible values are: "preorder" (first
        parent and then children) 'postorder' (first children and
        the parent) and "levelorder" (nodes are visited in order
        from root to leaves)
    :argument None isLeafFn: If supplied, ``isLeafFn``
        function will be used to interrogate nodes about if they
        are terminal or internal. ``isLeafFn`` function should
        receive a node instance as first argument and return True
        or False. Use this argument to traverse a tree by
        dynamically collapsing internal nodes matching
        ``isLeafFn``.
  */
  traverse(strategy = "levelorder", isLeafFn) {
    if (strategy == "preorder") {
      return this.iterDescendantsPreorder(isLeafFn);
    } else if (strategy == "levelorder") {
      return this.iterDescendantsLevelorder(isLeafFn);
    } else if (strategy == "postorder") {
      return this.iterDescendantsPostorder(isLeafFn);
    }
  }

  /**
   * Iterate over all nodes in a tree yielding every node in both
   * pre and post order. Each iteration returns a postorder flag
   * (True if node is being visited in postorder) and a node
   * instance.
   */
  iterPrepostorder(isLeafFn) {
    toVisit = [this];
    const isLeaf = isLeafFn ?? this.isLeaf;

    while (toVisit.length > 0) {
      node = toVisit.pop(-1);
      try {
        node = node[1];

        // POSTORDER ACTIONS
        return { done: true, value: node };
      } catch (error) {
        // PREORDER ACTIONS
        return { done: false, value: node };

        if (!isLeaf(node)) {
          // ADD CHILDREN
          toVisit.extend(reversed(node.children + [[1, node]]));
        }
      }
    }
  }
}
// class Tree is an alias for TreeNode
export class Tree extends TreeNode {}
