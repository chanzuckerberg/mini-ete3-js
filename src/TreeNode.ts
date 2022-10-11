import { TreeNodeType } from "./d";
import { readNewick } from "./newickAdapter";

export class TreeNode {
  // TreeNode (Tree) class is used to store a tree structure. A tree
  // consists of a collection of TreeNode instances connected in a
  // hierarchical way. Trees can be loaded from the New Hampshire Newick
  // format (newick).

  children: Array<TreeNodeType>; // direct descendents of this node
  up: TreeNodeType | null; // parent node
  dist: number; // distance from the node to its parents (branchlength)
  support: number; // support value of the node
  name: string;

  constructor(
    newick = null,
    format = 0,
    dist = null,
    support = null,
    name = null,
    quoted_node_names = false
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
}

// class Tree is an alias for TreeNode
export class Tree extends TreeNode {}
