export interface TreeNodeType {
  children: Array<TreeNodeType>; // direct descendents of this node
  up: Node | null; // parent node
  dist: number; // distance from the node to its parents (branchlength)
  support: number; // support value of the node
  name: string;
}
