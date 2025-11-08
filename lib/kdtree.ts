interface Node {
  index: number;
  point: number[];
  splitDim: number;
  left: Node | null;
  right: Node | null;
}

export class KDTree {
  private root: Node | null = null;
  private dimensions: number;

  constructor(points: number[][]) {
    if (points.length === 0) {
      throw new Error("Cannot build tree from empty dataset");
    }

    this.dimensions = points[0].length;
    const indices = Array.from({ length: points.length }, (_, i) => i);
    this.root = this.buildTree(points, indices, 0, points.length, 0);
  }

  private buildTree(
    points: number[][],
    indices: number[],
    start: number,
    end: number,
    depth: number
  ): Node | null {
    if (start >= end) return null;

    const axis = depth % this.dimensions;
    const subset = indices.slice(start, end);

    subset.sort((i, j) => points[i][axis] - points[j][axis]);

    for (let i = 0; i < subset.length; i++) {
      indices[start + i] = subset[i];
    }

    const median = Math.floor((start + end) / 2);
    const nodeIndex = indices[median];

    return {
      index: nodeIndex,
      point: points[nodeIndex],
      splitDim: axis,
      left: this.buildTree(points, indices, start, median, depth + 1),
      right: this.buildTree(points, indices, median + 1, end, depth + 1),
    };
  }

  findNearest(query: number[], k: number): Array<{ index: number; dist: number }> {
    const neighbors: Array<{ index: number; dist: number }> = [];

    const traverse = (node: Node | null): void => {
      if (!node) return;

      const distance = this.squaredDistance(query, node.point);

      if (neighbors.length < k) {
        neighbors.push({ index: node.index, dist: distance });
        neighbors.sort((a, b) => b.dist - a.dist);
      } else if (distance < neighbors[0].dist) {
        neighbors[0] = { index: node.index, dist: distance };
        neighbors.sort((a, b) => b.dist - a.dist);
      }

      const splitValue = query[node.splitDim] - node.point[node.splitDim];
      const nearSide = splitValue <= 0 ? node.left : node.right;
      const farSide = splitValue <= 0 ? node.right : node.left;

      traverse(nearSide);

      const worstDist = neighbors.length < k ? Infinity : neighbors[0].dist;
      if (splitValue * splitValue < worstDist) {
        traverse(farSide);
      }
    };

    traverse(this.root);
    return neighbors.sort((a, b) => a.dist - b.dist);
  }

  private squaredDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return sum;
  }
}
