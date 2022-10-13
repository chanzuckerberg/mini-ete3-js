import { TreeNode } from "./TreeNode";

export const setIntersection = (a: Set<any>, b: Set<any>) => {
  return new Set([...a].filter(x => b.has(x)));
}

//* Given an array with elements which are an unknown mixture of strings (TreeNode names) and TreeNodes, find the corresponding TreeNode objects for any string elements, returning an array of TreeNodes */
export const _translateNodes = (root: TreeNode, nodes: Array<TreeNode | string>) => {
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

/**
 * Returns the first common ancestor for array of 'targetNodes'.
 *
 * Similar to ETE's TreeNode.get_common_ancestor method, but it is only meant
 * to work with taking in an array of target nodes, unlike the ETE version
 * that can also take an arbitrary number of nodes as arguments and handle
 * that as a list.
 *
 * TODO -- The return type on this is funky. Really changes return structure
 * depending on optional param of `getPath`. Could write very nice TypeScript
 * with a function overload, but I don't have time right now. But we don't
 * want caller to have to determine which one was returned with a type guard.
 */
export const getCommonAncestor = (
  targetNodes: TreeNode[],
  getPath: boolean = false
) => {
  // Handle trivial cases with small number of nodes.
   if (targetNodes.length === 0) {
    throw new Error("getCommonAncestor called with an empty array");
   }
   if (targetNodes.length === 1) {
    // only one node provided, so we just return it
    if (getPath) {
      return {
        common: targetNodes[0],
        paths: {},
      };
    }
    return targetNodes[0];
   }
   // Normal case, more than two entries in targetNodes
   const nodeToPath: Record<string, Set<TreeNode>> = {};
   // First node in targetNodes gets used as reference node.
   const reference: TreeNode[] = [];  // Becomes path from refNode to root
   targetNodes.forEach((targetNode, idx) => {
    const targetNodePath: Set<TreeNode> = new Set();
    let currentNode: TreeNode | null = targetNode;
    while (currentNode !== null) {
      targetNodePath.add(currentNode);
      if (idx === 0) { // first node, so also handle being reference node
        reference.push(currentNode);
      }
      currentNode = currentNode.up;
    }
    nodeToPath[targetNode.name] = targetNodePath;
   });

   let commonNode: TreeNode | null = null;
   const allPaths = Object.values(nodeToPath);
   // Work through the refNode's path one at a time, looking for first node
   // in it that is shared in every targetNode's path set.
   for (const node of reference) {
    const isNodeInAllPaths = allPaths.every((path) => path.has(node));
    if (isNodeInAllPaths) {
      commonNode = node;
      break; // No reason to continue the for-loop, we found our commonNode
    }
   }
   if (commonNode === null) {
    throw new Error("Nodes are not connected!");
   }

   if (getPath) {
    return {
      common: commonNode,
      paths: nodeToPath,
    };
   }
   return commonNode;
}
