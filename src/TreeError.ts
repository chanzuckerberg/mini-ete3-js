/**
 * A problem occurred during a TreeNode operation.
 */
export class TreeError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
