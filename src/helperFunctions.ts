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
    

