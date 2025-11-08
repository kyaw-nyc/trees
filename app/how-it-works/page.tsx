"use client";

import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="dark h-screen bg-background text-foreground overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">How it works</h1>
          <div className="flex items-center gap-4">
            <a
              href="/mealup_mock_profiles.csv"
              download
              className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
            >
              Download example CSV
            </a>
            <Link href="/">
              <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
                Back to demo
              </button>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This application uses a KD-Tree (k-dimensional tree) data structure to efficiently find
              similar items based on multiple features. The visualization shows how items are
              positioned in a 2D space based on their similarity across various attributes.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Works with any CSV:</span> Upload any CSV file with any columns.
              The first column is treated as the identifier/name, and all other columns are used as features
              for similarity matching. Multi-valued fields (like "apple; banana; orange") are automatically
              detected if they contain semicolons.
            </p>
          </section>

          {/* Step 1: Feature Encoding */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Feature Encoding</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Each item is converted into a high-dimensional vector using one-hot encoding. For categorical features,
              each unique value becomes a separate dimension. For multi-valued features (detected by semicolons),
              each unique item becomes its own dimension.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`// Example: CSV with columns Fruit, Color, Tags
// Row: "Apple", "Red", "Sweet; Crisp"

// Becomes vector:
[
  // Color dimension
  1, 0, 0,  // Red=1, Green=0, Yellow=0

  // Tags dimension (multi-valued)
  1, 1, 0   // Sweet=1, Crisp=1, Sour=0
]`}</pre>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              All features have equal weight (1.0) by default, but you can optionally configure custom weights
              for specific features to prioritize certain attributes in the similarity matching.
            </p>
          </section>

          {/* Step 2: KD-Tree Construction */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. KD-Tree Construction</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A KD-Tree is built by recursively partitioning the data space. At each level, we split
              the data along a different dimension:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`buildTree(points, indices, start, end, depth) {
  if (start >= end) return null;

  // Alternate splitting dimension
  const axis = depth % this.dimensions;

  // Sort by current dimension
  subset.sort((i, j) =>
    points[i][axis] - points[j][axis]
  );

  // Split at median
  const median = Math.floor((start + end) / 2);

  return {
    point: points[median],
    left: buildTree(..., start, median, depth + 1),
    right: buildTree(..., median + 1, end, depth + 1)
  };
}`}</pre>
            </div>
          </section>

          {/* Step 3: Finding Nearest Neighbors */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Finding Nearest Neighbors</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The KD-Tree efficiently finds k-nearest neighbors using a traversal algorithm:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`findNearest(query, k) {
  const neighbors = [];

  const traverse = (node) => {
    if (!node) return;

    // Calculate distance to current node
    const distance = squaredDistance(query, node.point);

    // Update k-nearest list
    if (neighbors.length < k) {
      neighbors.push({ index: node.index, dist: distance });
    } else if (distance < neighbors[0].dist) {
      neighbors[0] = { index: node.index, dist: distance };
    }

    // Decide which subtree to explore
    const nearSide = query[splitDim] <= node.point[splitDim]
      ? node.left : node.right;
    const farSide = query[splitDim] <= node.point[splitDim]
      ? node.right : node.left;

    traverse(nearSide);

    // Only search far side if necessary
    const worstDist = neighbors.length < k
      ? Infinity : neighbors[0].dist;
    if (splitValue * splitValue < worstDist) {
      traverse(farSide);
    }
  };

  traverse(this.root);
  return neighbors;
}`}</pre>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This algorithm is O(log n) on average, making it much faster than brute-force O(n) search
              for finding nearest neighbors.
            </p>
          </section>

          {/* Step 4: Dimensionality Reduction */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Dimensionality Reduction (PCA)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To visualize high-dimensional data in 2D, we use Principal Component Analysis (PCA).
              This finds the two directions of maximum variance:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`reduceDimensionality(data) {
  // Center the data
  const means = calculateMeans(data);
  const centered = data.map(row =>
    row.map((val, j) => val - means[j])
  );

  // Compute covariance matrix
  const covariance = computeCovariance(centered);

  // Find top 2 eigenvectors using power iteration
  const component1 = findTopEigenvector(covariance);
  const deflated = deflateMatrix(covariance, component1);
  const component2 = findTopEigenvector(deflated);

  // Project data onto 2D space
  return centered.map(row => [
    dotProduct(row, component1),
    dotProduct(row, component2)
  ]);
}`}</pre>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The power iteration method computes eigenvectors by repeatedly multiplying the matrix
              by a vector and normalizing, converging to the dominant eigenvector.
            </p>
          </section>

          {/* Complexity Analysis */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Complexity Analysis</h2>
            <div className="bg-muted rounded-lg p-4">
              <ul className="space-y-2 text-sm">
                <li><span className="font-semibold">KD-Tree construction:</span> O(n log n)</li>
                <li><span className="font-semibold">k-NN search:</span> O(log n) average, O(n) worst case</li>
                <li><span className="font-semibold">PCA computation:</span> O(d² × n) where d is dimensions</li>
                <li><span className="font-semibold">Space complexity:</span> O(n × d)</li>
              </ul>
            </div>
          </section>

          {/* Distance Metric */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Distance Metric</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The algorithm uses Euclidean distance in the weighted feature space:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`squaredDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}`}</pre>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Since features are weighted during encoding, matching features contribute their weight
              to the distance calculation, while mismatches contribute zero.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
