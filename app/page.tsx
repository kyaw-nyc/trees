"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";

interface Profile {
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
}

export default function Home() {
  const [data, setData] = useState<Profile[]>([]);
  const [k, setK] = useState(5);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [frozenId, setFrozenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [useSample, setUseSample] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [showWeights, setShowWeights] = useState(false);

  useEffect(() => {
    if (csvFile) {
      fetchDataFromFile(csvFile, k, weights);
    } else if (useSample) {
      fetchSampleData(k, weights);
    }
  }, [k, csvFile, useSample, weights]);

  const fetchDataFromFile = async (file: File, kValue: number, weightsConfig: Record<string, number>) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('k', kValue.toString());
      formData.append('weights', JSON.stringify(weightsConfig));

      const res = await fetch('/api/process-upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      setData(result.profiles);

      // Extract features from first profile's metadata
      if (result.profiles && result.profiles.length > 0) {
        const featureList = Object.keys(result.profiles[0].metadata);
        setFeatures(featureList);

        // Initialize weights to 1.0 for new features
        const newWeights: Record<string, number> = {};
        featureList.forEach(feature => {
          newWeights[feature] = weightsConfig[feature] || 1.0;
        });
        if (JSON.stringify(newWeights) !== JSON.stringify(weightsConfig)) {
          setWeights(newWeights);
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleData = async (kValue: number, weightsConfig: Record<string, number>) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        k: kValue.toString(),
        weights: JSON.stringify(weightsConfig)
      });
      const res = await fetch(`/api/process?${params}`);
      const result = await res.json();
      setData(result.profiles);

      // Extract features from first profile's metadata
      if (result.profiles && result.profiles.length > 0) {
        const featureList = Object.keys(result.profiles[0].metadata);
        setFeatures(featureList);

        // Initialize weights to 1.0 for new features
        const newWeights: Record<string, number> = {};
        featureList.forEach(feature => {
          newWeights[feature] = weightsConfig[feature] || 1.0;
        });
        if (JSON.stringify(newWeights) !== JSON.stringify(weightsConfig)) {
          setWeights(newWeights);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    setCsvFile(null);
    setUseSample(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUseSample(false);
      setCsvFile(file);
    }
  };

  // Calculate viewport dimensions for SVG
  const width = 700;
  const height = 550;
  const padding = 60;

  // Scale data to fit in viewport
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const scaleX = (x: number) =>
    padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const scaleY = (y: number) =>
    height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  const activeId = frozenId !== null ? frozenId : hoveredId;
  const hovered = data.find((p) => p.id === activeId);

  const handleDotClick = (id: number) => {
    if (frozenId === id) {
      setFrozenId(null);
    } else {
      setFrozenId(id);
    }
  };

  return (
    <div className="dark h-screen overflow-hidden bg-background">
      <div className="h-full flex flex-col p-8 gap-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">kdtrees demonstration</h1>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works">
              <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
                How it works
              </button>
            </Link>
            <button
              onClick={loadSampleData}
              className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
            >
              Sample CSV
            </button>
            <label className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors cursor-pointer">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {data.length > 0 && (
              <>
                <button
                  onClick={() => setShowWeights(!showWeights)}
                  className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
                >
                  {showWeights ? "Hide" : "Adjust"} Weights
                </button>
                <span className="text-sm text-muted-foreground">k={k}</span>
                <Slider
                  value={[k]}
                  onValueChange={(val) => setK(val[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-32"
                />
              </>
            )}
          </div>
        </div>

        {/* Weight Adjustment Panel */}
        {showWeights && data.length > 0 && (
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Feature Weights</h3>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">{feature}</label>
                    <span className="text-xs text-muted-foreground">
                      {weights[feature]?.toFixed(1) || "1.0"}
                    </span>
                  </div>
                  <Slider
                    value={[weights[feature] || 1.0]}
                    onValueChange={(val) => {
                      setWeights({ ...weights, [feature]: val[0] });
                    }}
                    min={0}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left: Graph */}
          <div className="flex-1 border border-border rounded-lg p-6 flex items-center justify-center">
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : data.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Upload a CSV or load sample data to begin
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
            <svg
              width={width}
              height={height}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
            >

              {/* Connection lines */}
              {hovered &&
                hovered.neighbors.map((neighbor, idx) => {
                  const neighborData = data[neighbor.id];
                  return (
                    <line
                      key={idx}
                      x1={scaleX(hovered.x)}
                      y1={scaleY(hovered.y)}
                      x2={scaleX(neighborData.x)}
                      y2={scaleY(neighborData.y)}
                      stroke="#ffffff"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}

              {/* Data points */}
              {data.map((profile) => {
                const isActive = profile.id === activeId;
                const isNeighbor =
                  hovered?.neighbors.some((n) => n.id === profile.id) || false;

                return (
                  <circle
                    key={profile.id}
                    cx={scaleX(profile.x)}
                    cy={scaleY(profile.y)}
                    r={isActive ? 6 : isNeighbor ? 5 : 3}
                    fill={isActive ? "#ffffff" : isNeighbor ? "#ffffff" : "#404040"}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => {
                      if (frozenId === null) {
                        setHoveredId(profile.id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (frozenId === null) {
                        setHoveredId(null);
                      }
                    }}
                    onClick={() => handleDotClick(profile.id)}
                  />
                );
              })}
            </svg>

            {/* Tooltip */}
            {hovered && frozenId === null && (
              <div
                className="absolute pointer-events-none bg-white text-black px-3 py-2 rounded text-sm font-medium z-10 shadow-lg"
                style={{
                  left: mousePos.x + 12,
                  top: mousePos.y - 8,
                }}
              >
                {hovered.name}
              </div>
            )}
          </div>
            )}
          </div>

          {/* Right: Info Panel */}
          {data.length > 0 && (
            <div className="w-80 border border-border rounded-lg p-6 flex flex-col overflow-hidden">
              {hovered ? (
              <>
                <div className="mb-6">
                  <h2 className="text-base font-medium mb-3">{hovered.name}</h2>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    {Object.entries(hovered.metadata).slice(0, 3).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-foreground">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </div>

                {hovered.neighbors.length > 0 && (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="text-xs text-muted-foreground mb-2">Nearest neighbors</div>
                    <div className="space-y-1">
                      {hovered.neighbors.map((neighbor, idx) => (
                        <div
                          key={idx}
                          className="text-sm flex justify-between items-center py-1.5"
                        >
                          <span>{neighbor.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {neighbor.dist}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Hover to view
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
