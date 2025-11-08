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
            <p className="text-muted-foreground leading-relaxed mb-4">
              <span className="font-semibold text-foreground">Works with any CSV:</span> Upload any CSV file with any columns.
              The first column is treated as the identifier/name, and all other columns are used as features
              for similarity matching. Multi-valued fields (like "apple; banana; orange") are automatically
              detected if they contain semicolons.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Sample data auto-loads:</span> The demo page automatically
              loads example student profile data when you first visit, so you can immediately explore how the KD-tree
              visualization works without uploading a file.
            </p>
          </section>

          {/* Using the Application */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Using the Application</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Controls:</h3>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">k-slider:</span> Adjust the number of nearest neighbors to find (1-10)</li>
                  <li><span className="font-semibold text-foreground">Sample CSV:</span> Load the default example dataset</li>
                  <li><span className="font-semibold text-foreground">Upload CSV:</span> Load your own data from a CSV file</li>
                  <li><span className="font-semibold text-foreground">Adjust Weights:</span> Show/hide feature weight controls</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Interactions:</h3>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">Hover:</span> Move mouse over dots to see connections and info</li>
                  <li><span className="font-semibold text-foreground">Click:</span> Click a dot to freeze the selection and explore</li>
                  <li><span className="font-semibold text-foreground">Click again:</span> Unfreeze and return to hover mode</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Weight Adjustment:</h3>
                <p className="text-muted-foreground mb-2">
                  Click "Adjust Weights" to reveal sliders for each feature. Modify weights to control feature importance:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">0.0:</span> Feature completely ignored in similarity calculation</li>
                  <li><span className="font-semibold text-foreground">1.0:</span> Default weight (equal importance)</li>
                  <li><span className="font-semibold text-foreground">2.0-3.0:</span> Feature 2-3x more important than default</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  The visualization updates in real-time as you adjust weights, recalculating nearest neighbors based on
                  your custom similarity metric.
                </p>
              </div>
            </div>
          </section>

          {/* Step 1: Feature Encoding */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Feature Encoding</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Each item is converted into a high-dimensional vector using one-hot encoding with configurable weights.
              For categorical features, each unique value becomes a separate dimension. For multi-valued features
              (detected by semicolons), each unique item becomes its own dimension.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`// Example: CSV with columns Fruit, Color, Tags
// Row: "Apple", "Red", "Sweet; Crisp"
// Weights: Color=1.5, Tags=2.0

// Becomes weighted vector:
[
  // Color dimension (weight=1.5)
  1.5, 0, 0,  // Red=1.5, Green=0, Yellow=0

  // Tags dimension (weight=2.0, multi-valued)
  2.0, 2.0, 0 // Sweet=2.0, Crisp=2.0, Sour=0
]`}</pre>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <span className="font-semibold text-foreground">Default weights:</span> All features start with weight 1.0
              (equal importance). Use the "Adjust Weights" button in the UI to customize how much each feature contributes
              to similarity matching. Weights range from 0 (feature completely ignored) to 3.0 (feature 3x more important).
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
              <pre>{`class FeatureEncoder {
  private weights: Record<string, number> = {};

  constructor(weights?: Record<string, number>) {
    this.weights = weights || {};  // Default to empty
  }

  encode(profile: Profile): number[] {
    // ...
    const weight = this.weights[key] || 1.0;  // Default 1.0
    vector[position++] = category === value ? weight : 0;
  }
}`}</pre>
            </div>
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
