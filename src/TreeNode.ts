import { TreeNodeType } from "./d";
import { read_newick } from "./newickAdapter";

DEFAULT_COMPACT = false;
DEFAULT_SHOWINTERNAL = false;
DEFAULT_DIST = "1.0";
DEFAULT_SUPPORT = "1.0";
DEFAULT_NAME = "";

export class TreeNode {
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
    this.children = [];
    this.up = null;
    this.dist = dist ? dist : 1.0;
    this.support = support ? support : 1.0;
    this.name = name ? name : DEFAULT_NAME;

    if (newick) {
      read_newick(newick, this, format, quoted_node_names);
    }
  }

  /**
   *  This allows to execute tree.and('A') to obtain the descendant node
   *  whose name is "A".
   */
  function and(value) {
    try {
      firstMatch = next(this.iterSearchNodes({ name: value }));
      return firstMatch;
    } catch (error) {
      throw TreeError("Node not found");
    }
  }

  /**
   * This allows us to sum two trees.
   */
  function add(value) {
    if (value instanceof TreeNode) {
      newRoot = TreeNode();
      newRoot.addChild(this);
      newRoot.addChild(value);
      return newRoot;
    } else {
      throw TreeError("Invalid node type");
    }
  }

  /**
   * Print tree in newick format.
   */
  function toString() {
    return this.getAscii({
      compact: DEFAULT_COMPACT,
      showInternal: DEFAULT_SHOWINTERNAL,
    });
  }

  /**
   * Check if item belongs to this node. The 'item' argument must be a node instance or its
   * associated name.
   */
  function contains(item) {
    if (item instanceof TreeNode) {
      return item in set(this.getDescendants());
    } else if (typeof item === "string") {
      return item in set([n.name for n in self.traverse()]);
    }
  }

  /**
   * Node len returns number of children.
   */
  function length() {
      return this.getLeaves().length ?? 0;
  }

  /**
   *Iterator over leaf nodes
   */
  function iterate(self) {
      return this.iterLeaves();
  }
}
