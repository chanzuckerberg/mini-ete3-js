export const setIntersection = (a: Set<any>, b: Set<any>) => {
  return new Set([...a].filter(x => b.has(x)));
}