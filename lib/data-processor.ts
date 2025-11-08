import { KDTree } from "./kdtree";

export interface Profile {
  name: string;
  single: Record<string, string>;
  multi: Record<string, Set<string>>;
}

interface ColumnMetadata {
  name: string;
  isMultiValued: boolean;
}

export interface ProcessedData {
  profiles: Array<{
    id: number;
    name: string;
    x: number;
    y: number;
    metadata: Record<string, string>;
    neighbors: Array<{
      id: number;
      name: string;
      dist: number;
    }>;
  }>;
}

class FeatureEncoder {
  private categoricalFeatures = new Map<string, string[]>();
  private setFeatures = new Map<string, string[]>();
  private singleKeys: string[] = [];
  private multiKeys: string[] = [];
  private weights: Record<string, number> = {};
  vectorSize = 0;

  constructor(weights?: Record<string, number>) {
    this.weights = weights || {};
  }

  train(profiles: Profile[]) {
    for (const profile of profiles) {
      for (const [key, value] of Object.entries(profile.single)) {
        if (!this.categoricalFeatures.has(key)) {
          this.categoricalFeatures.set(key, []);
        }
        this.categoricalFeatures.get(key)!.push(value);
      }

      for (const [key, values] of Object.entries(profile.multi)) {
        if (!this.setFeatures.has(key)) {
          this.setFeatures.set(key, []);
        }
        this.setFeatures.get(key)!.push(...values);
      }
    }

    for (const [key, values] of this.categoricalFeatures) {
      const unique = [...new Set(values)].sort();
      this.categoricalFeatures.set(key, unique);
    }

    for (const [key, values] of this.setFeatures) {
      const unique = [...new Set(values)].sort();
      this.setFeatures.set(key, unique);
    }

    this.singleKeys = Array.from(this.categoricalFeatures.keys());
    this.multiKeys = Array.from(this.setFeatures.keys());

    let size = 0;
    for (const key of this.singleKeys) {
      size += this.categoricalFeatures.get(key)!.length;
    }
    for (const key of this.multiKeys) {
      size += this.setFeatures.get(key)!.length;
    }
    this.vectorSize = size;
  }

  encode(profile: Profile): number[] {
    const vector = new Array(this.vectorSize).fill(0);
    let position = 0;

    for (const key of this.singleKeys) {
      const categories = this.categoricalFeatures.get(key)!;
      const weight = this.weights[key] || 1.0;
      const value = profile.single[key];

      for (const category of categories) {
        vector[position++] = category === value ? weight : 0;
      }
    }

    for (const key of this.multiKeys) {
      const categories = this.setFeatures.get(key)!;
      const weight = this.weights[key] || 1.0;
      const values = profile.multi[key] || new Set();

      for (const category of categories) {
        vector[position++] = values.has(category) ? weight : 0;
      }
    }

    return vector;
  }
}

export function parseCSV(text: string): Profile[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  if (headers.length === 0) {
    throw new Error("CSV must have at least one column");
  }

  // First column is always the identifier/name
  const nameColumn = headers[0];
  const featureColumns = headers.slice(1);

  // Detect which columns are multi-valued by sampling the data
  const columnMetadata = detectColumnTypes(lines, headers);

  const profiles: Profile[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || "";
    });

    const single: Record<string, string> = {};
    const multi: Record<string, Set<string>> = {};

    featureColumns.forEach(column => {
      const metadata = columnMetadata.find(m => m.name === column);
      if (metadata?.isMultiValued) {
        multi[column] = parseMultiValue(row[column] || "");
      } else {
        single[column] = row[column] || "";
      }
    });

    profiles.push({
      name: row[nameColumn] || `Row ${i}`,
      single,
      multi,
    });
  }

  return profiles;
}

function detectColumnTypes(lines: string[], headers: string[]): ColumnMetadata[] {
  const metadata: ColumnMetadata[] = [];

  // Skip the name column (first column)
  for (let colIdx = 1; colIdx < headers.length; colIdx++) {
    const columnName = headers[colIdx].trim();
    let hasSemicolon = false;

    // Sample up to 10 rows to detect multi-valued columns
    const sampleSize = Math.min(lines.length - 1, 10);
    for (let rowIdx = 1; rowIdx <= sampleSize; rowIdx++) {
      const values = parseLine(lines[rowIdx]);
      const cellValue = values[colIdx]?.trim() || "";

      if (cellValue.includes(";")) {
        hasSemicolon = true;
        break;
      }
    }

    metadata.push({
      name: columnName,
      isMultiValued: hasSemicolon,
    });
  }

  return metadata;
}

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function parseMultiValue(text: string): Set<string> {
  if (!text || !text.trim()) return new Set();

  return new Set(
    text
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );
}

function reduceDimensionality(data: number[][]): number[][] {
  const rows = data.length;
  const cols = data[0].length;

  const means = new Array(cols).fill(0);
  for (const row of data) {
    for (let j = 0; j < cols; j++) {
      means[j] += row[j];
    }
  }
  means.forEach((_, i) => means[i] /= rows);

  const centered = data.map((row) =>
    row.map((val, j) => val - means[j])
  );

  const covariance = Array.from({ length: cols }, () =>
    new Array(cols).fill(0)
  );

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < rows; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      covariance[i][j] = sum / rows;
    }
  }

  const component1 = findTopEigenvector(covariance);
  const deflated = deflateMatrix(covariance, component1);
  const component2 = findTopEigenvector(deflated);

  return centered.map((row) => [
    dotProduct(row, component1),
    dotProduct(row, component2),
  ]);
}

function findTopEigenvector(matrix: number[][]): number[] {
  const size = matrix.length;
  let vector = new Array(size).fill(1 / Math.sqrt(size));

  for (let iter = 0; iter < 100; iter++) {
    const next = matrix.map((row) => dotProduct(row, vector));
    const magnitude = Math.sqrt(next.reduce((sum, v) => sum + v * v, 0));
    vector = next.map((v) => v / magnitude);
  }

  return vector;
}

function deflateMatrix(matrix: number[][], eigenvector: number[]): number[][] {
  const size = matrix.length;
  const result: number[][] = [];

  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(matrix[i][j] - eigenvector[i] * eigenvector[j]);
    }
    result.push(row);
  }

  return result;
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export function processData(csvText: string, k: number, weights?: Record<string, number>): ProcessedData {
  const profiles = parseCSV(csvText);

  const encoder = new FeatureEncoder(weights);
  encoder.train(profiles);

  const vectors = profiles.map((p) => encoder.encode(p));
  const coordinates = reduceDimensionality(vectors);

  const tree = new KDTree(vectors);
  const results: ProcessedData = { profiles: [] };

  for (let i = 0; i < profiles.length; i++) {
    const nearest = tree.findNearest(vectors[i], Math.min(k + 1, vectors.length));

    const neighbors = nearest
      .filter((n) => n.index !== i)
      .slice(0, k)
      .map((n) => ({
        id: n.index,
        name: profiles[n.index].name,
        dist: parseFloat(Math.sqrt(n.dist).toFixed(3)),
      }));

    // Combine single and multi-valued features into metadata
    const metadata: Record<string, string> = { ...profiles[i].single };

    // Convert multi-valued features to string representation
    for (const [key, values] of Object.entries(profiles[i].multi)) {
      metadata[key] = Array.from(values).join("; ");
    }

    results.profiles.push({
      id: i,
      name: profiles[i].name,
      x: coordinates[i][0],
      y: coordinates[i][1],
      metadata,
      neighbors,
    });
  }

  return results;
}
