import { TreeNodeType } from "./d";
import { read_newick } from "./newickAdapter";

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
    this.name = name ? name : "NoName";

    if (newick) {
      read_newick(newick, this, format, quoted_node_names);
    }
  }
}
