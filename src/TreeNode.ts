import { DEFAULT_DIST, DEFAULT_COMPACT, DEFAULT_NAME, DEFAULT_SHOWINTERNAL, DEFAULT_SUPPORT } from "./constants";
import { readNewick } from "./newickAdapter";
import {TreeError} from "./TreeError";

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
    this.name = name ? name : DEFAULT_NAME;

    if (newick) {
      readNewick(newick, this, format, quoted_node_names);
    }
  }
  /***************************/
  /** DUNDER METHODS **/
  /***************************/

    /**
   This allows to execute tree.and('A') to obtain the descendant node
   whose name is "A".
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
      if (preserve_branch_length) {
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

    if (prevent_nondicotomic && parent && parent.children.length < 2) {
      parent.delete(prevent_nondicotomic, preserve_branch_length);
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
    this.up = null
    return this
  }

  /**Prunes the topology of a node to conserve only the selected list of leaf
    nodes. The minimum number of nodes that conserve the
    topological relationships among the requested nodes will be
    retained. Root node is always conserved.
    :var nodes: a list of node names or node objects that should be retained
    :param False preserve_branch_length: If True, branch lengths
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
  prune(nodes, preserve_branch_length=false) {

    let node2count: {[key: string] : string[]} = {}
    let node2depth: {[key: string] : number} = {};

    let toKeep: TreeNode[] = _translate_nodes(this, nodes)
    // if several nodes are in the same path of two kept nodes,
    // only one should be maintained. This prioritize internal
    // nodes that are already in the to_keep list and then
    // deeper nodes (closer to the leaves). 
    const cmp_nodes = (x, y) => {
      if (node2depth[x] > node2depth[y]) {
        return -1;
      } else if (node2depth[x] < node2depth[y]) {
        return 1;
      } else {
        return 0;
      }
    }

    //TODO: make sure we ended up returning arguments in this format
    const {start, node2path} = this.getCommonAncestor(toKeep, true)
    // always retain the root
    toKeep.push(this)

    // Calculate which kept nodes are visiting the same nodes in
    // their path to the common ancestor.
    Object.entries(node2path).forEach(([nodeName, path]) => {
      path.forEach((visitedNode: TreeNode) => {
        if (!Object.keys(node2depth).includes(visitedNode.name)) {
          const depth = visitedNode.getDistance(start, true)
          node2depth[visitedNode.name] = depth
        }
        if (!(nodeName === visitedNode.name)) {
          node2count[visitedNode.name] = [nodeName]
        }
    })
  })

  // if several internal nodes are in the path of exactly the same kept
  // nodes, only one (the deepest) should be maintain.
  const visitors2Nodes = {}

  Object.entries(node2count).forEach(([nodeName, visitorNames]) => {
    // keep nodes in connection with at least two other nodes
    if (visitorNames.length > 1) {
      const visitorKey = visitorNames.sort().join(',')
      if (!visitors2Nodes[visitorKey]) {
        visitors2Nodes[visitorKey] = []
      }
      visitors2Nodes[visitorKey].push(nodeName)
    }
  })

  Object.entries(visitors2Nodes).forEach(([visitorKey, nodeNames]) => {
    //TODO: translate whatever the heck this is doing
    // if not (to_keep & nodes):
    // sorted_nodes = sorted(nodes, key=cmp_to_key(cmp_nodes))
    // to_keep.add(sorted_nodes[0])
    console.warn('block missing translation from within `prune`!')
  }

  this.getDescendents('postorder').forEach((node: TreeNode) => {
    if (!toKeep.includes(node)) {
      if (preserve_branch_length) {
        if (node.children.length === 1) {
          node.children[0].dist += n.dist
        } else if (node.children.length > 1 && node.up) {
          node.up.dist += node.dist
      }
    }
    node.delete(true)
  }
    })

    // TODO: missing some ending brace here somewhere
  }

  // Reverses the current children order
  swapChildren() {
    if (this.children.length > 1) {
      this.children.reverse()
    }
  }

}


// class Tree is an alias for TreeNode
export class Tree extends TreeNode {}

//* Given an array with elements which are an unknown mixture of strings (TreeNode names) and TreeNodes, find the corresponding TreeNode objects for any string elements, returning an array of TreeNodes */
const _translateNodes = (root: TreeNode, nodes: Array<TreeNode | string>) => {
    let name2node: {[key: string]: TreeNode | null} = {}

    nodes.forEach((node) => {
      if (typeof node === 'string') {
        name2node[node] = null
      }})


      if (Object.keys(name2node).length > 0) {
        root.traverse().forEach((n: TreeNode) => {
          if (n.name in Object.keys(name2node)) {
            if (name2node[n.name] !== null) {
              throw new TreeError('Ambiguous node name: ' + n.name) 
            } else {
                name2node[n.name] = n
              }
          }
        })
      }

      if (Object.values(name2node).includes(null)) {
        let missing = Object.keys(name2node).filter((k) => name2node[k] === null)
        throw new TreeError("Node name(s) not found: " + missing.join(', '))
      }

      let validNodes: TreeNode[] = []
      nodes.forEach((node) => {
        if (node instanceof TreeNode) {
          validNodes.push(node)
        } else if (!(typeof node === 'string')) {
          throw new TreeError('Invalid node type: ' + node)
        }
      })

      //@ts-ignore if there were any null values in name2node, we would have thrown an error
      validNodes += Object.values(name2node)
      return validNodes
      }
    

