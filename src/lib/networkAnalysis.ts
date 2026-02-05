import { Note, Connection } from '@/types';

// Graph export format for external analysis tools
export interface GraphExport {
  nodes: {
    id: string;
    label: string;
    category: string;
    timeHorizon: string;
    votes: number;
    metadata: Record<string, any>;
  }[];
  edges: {
    source: string;
    target: string;
    weight?: number;
    type?: string;
  }[];
}

export interface CentralityResult {
  nodeId: string;
  noteText: string;
  score: number;
  rank: number;
}

export interface PathResult {
  path: string[];
  pathNotes: { id: string; text: string }[];
  length: number;
}

export interface NetworkAnalysis {
  degreeCentrality: CentralityResult[];
  betweennessCentrality: CentralityResult[];
  inDegreeCentrality: CentralityResult[];
  outDegreeCentrality: CentralityResult[];
  shortestPaths: Map<string, Map<string, PathResult>>;
  longestPath: PathResult | null;
  density: number;
  nodeCount: number;
  edgeCount: number;
  stronglyConnectedComponents: string[][];
}

// Convert notes and connections to graph export format
export function exportToGraph(notes: Note[], connections: Connection[]): GraphExport {
  const connectedNodeIds = new Set<string>();
  connections.forEach(c => {
    connectedNodeIds.add(c.sourceId);
    connectedNodeIds.add(c.targetId);
  });

  // Only include notes that are connected
  const relevantNotes = notes.filter(n => connectedNodeIds.has(n.id));

  return {
    nodes: relevantNotes.map(note => ({
      id: note.id,
      label: note.text,
      category: note.category,
      timeHorizon: note.timeframe,
      votes: note.votes || 0,
      metadata: {
        createdBy: note.createdBy,
        createdAt: note.createdAt,
        tags: note.tags || [],
      },
    })),
    edges: connections.map(conn => ({
      source: conn.sourceId,
      target: conn.targetId,
      weight: 1,
      type: 'dependency',
    })),
  };
}

// Build adjacency lists for graph traversal
function buildAdjacencyLists(connections: Connection[]) {
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();

  connections.forEach(conn => {
    if (!outgoing.has(conn.sourceId)) outgoing.set(conn.sourceId, new Set());
    if (!incoming.has(conn.targetId)) incoming.set(conn.targetId, new Set());
    outgoing.get(conn.sourceId)!.add(conn.targetId);
    incoming.get(conn.targetId)!.add(conn.sourceId);
  });

  return { outgoing, incoming };
}

// Calculate degree centrality
export function calculateDegreeCentrality(notes: Note[], connections: Connection[]): CentralityResult[] {
  const { outgoing, incoming } = buildAdjacencyLists(connections);
  const degrees = new Map<string, number>();

  // Get all connected node IDs
  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  nodeIds.forEach(id => {
    const outDeg = outgoing.get(id)?.size || 0;
    const inDeg = incoming.get(id)?.size || 0;
    degrees.set(id, outDeg + inDeg);
  });

  const results: CentralityResult[] = [];
  degrees.forEach((score, nodeId) => {
    const note = notes.find(n => n.id === nodeId);
    if (note) {
      results.push({
        nodeId,
        noteText: note.text,
        score,
        rank: 0,
      });
    }
  });

  // Sort by score descending and assign ranks
  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);

  return results;
}

// Calculate in-degree centrality
export function calculateInDegreeCentrality(notes: Note[], connections: Connection[]): CentralityResult[] {
  const { incoming } = buildAdjacencyLists(connections);
  const results: CentralityResult[] = [];

  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  nodeIds.forEach(nodeId => {
    const note = notes.find(n => n.id === nodeId);
    if (note) {
      results.push({
        nodeId,
        noteText: note.text,
        score: incoming.get(nodeId)?.size || 0,
        rank: 0,
      });
    }
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);
  return results;
}

// Calculate out-degree centrality
export function calculateOutDegreeCentrality(notes: Note[], connections: Connection[]): CentralityResult[] {
  const { outgoing } = buildAdjacencyLists(connections);
  const results: CentralityResult[] = [];

  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  nodeIds.forEach(nodeId => {
    const note = notes.find(n => n.id === nodeId);
    if (note) {
      results.push({
        nodeId,
        noteText: note.text,
        score: outgoing.get(nodeId)?.size || 0,
        rank: 0,
      });
    }
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);
  return results;
}

// Calculate betweenness centrality (simplified Brandes algorithm)
export function calculateBetweennessCentrality(notes: Note[], connections: Connection[]): CentralityResult[] {
  const { outgoing } = buildAdjacencyLists(connections);
  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  const nodes = Array.from(nodeIds);
  const betweenness = new Map<string, number>();
  nodes.forEach(n => betweenness.set(n, 0));

  // For each source node, do BFS and count shortest paths
  nodes.forEach(source => {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>(); // number of shortest paths
    const dist = new Map<string, number>();

    nodes.forEach(n => {
      predecessors.set(n, []);
      sigma.set(n, 0);
      dist.set(n, -1);
    });

    sigma.set(source, 1);
    dist.set(source, 0);

    const queue: string[] = [source];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const neighbors = outgoing.get(v) || new Set();
      neighbors.forEach(w => {
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          predecessors.get(w)!.push(v);
        }
      });
    }

    const delta = new Map<string, number>();
    nodes.forEach(n => delta.set(n, 0));

    while (stack.length > 0) {
      const w = stack.pop()!;
      predecessors.get(w)!.forEach(v => {
        const d = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + d);
      });
      if (w !== source) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  });

  const results: CentralityResult[] = [];
  betweenness.forEach((score, nodeId) => {
    const note = notes.find(n => n.id === nodeId);
    if (note) {
      results.push({
        nodeId,
        noteText: note.text,
        score: Math.round(score * 100) / 100,
        rank: 0,
      });
    }
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);
  return results;
}

// Find shortest path using BFS
export function findShortestPath(notes: Note[], connections: Connection[], fromId: string, toId: string): PathResult | null {
  const { outgoing } = buildAdjacencyLists(connections);

  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: fromId, path: [fromId] }];
  visited.add(fromId);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === toId) {
      return {
        path,
        pathNotes: path.map(id => {
          const note = notes.find(n => n.id === id);
          return { id, text: note?.text || 'Unknown' };
        }),
        length: path.length - 1,
      };
    }

    const neighbors = outgoing.get(node) || new Set();
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    });
  }

  return null;
}

// Find longest path using DFS (for DAG - directed acyclic graph)
export function findLongestPath(notes: Note[], connections: Connection[]): PathResult | null {
  const { outgoing } = buildAdjacencyLists(connections);
  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  let longestPath: string[] = [];

  // DFS from each node
  function dfs(node: string, visited: Set<string>, currentPath: string[]) {
    if (currentPath.length > longestPath.length) {
      longestPath = [...currentPath];
    }

    const neighbors = outgoing.get(node) || new Set();
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        dfs(neighbor, visited, [...currentPath, neighbor]);
        visited.delete(neighbor);
      }
    });
  }

  nodeIds.forEach(startNode => {
    const visited = new Set<string>([startNode]);
    dfs(startNode, visited, [startNode]);
  });

  if (longestPath.length === 0) return null;

  return {
    path: longestPath,
    pathNotes: longestPath.map(id => {
      const note = notes.find(n => n.id === id);
      return { id, text: note?.text || 'Unknown' };
    }),
    length: longestPath.length - 1,
  };
}

// Calculate network density
export function calculateDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount <= 1) return 0;
  const maxEdges = nodeCount * (nodeCount - 1); // for directed graph
  return Math.round((edgeCount / maxEdges) * 10000) / 10000;
}

// Find strongly connected components using Tarjan's algorithm
export function findStronglyConnectedComponents(connections: Connection[]): string[][] {
  const { outgoing } = buildAdjacencyLists(connections);
  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongConnect(node: string) {
    indices.set(node, index);
    lowlinks.set(node, index);
    index++;
    stack.push(node);
    onStack.set(node, true);

    const neighbors = outgoing.get(node) || new Set();
    neighbors.forEach(neighbor => {
      if (!indices.has(neighbor)) {
        strongConnect(neighbor);
        lowlinks.set(node, Math.min(lowlinks.get(node)!, lowlinks.get(neighbor)!));
      } else if (onStack.get(neighbor)) {
        lowlinks.set(node, Math.min(lowlinks.get(node)!, indices.get(neighbor)!));
      }
    });

    if (lowlinks.get(node) === indices.get(node)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.set(w, false);
        scc.push(w);
      } while (w !== node);
      sccs.push(scc);
    }
  }

  nodeIds.forEach(node => {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  });

  return sccs;
}

// Run full network analysis
export function analyzeNetwork(notes: Note[], connections: Connection[]): NetworkAnalysis {
  const nodeIds = new Set<string>();
  connections.forEach(c => {
    nodeIds.add(c.sourceId);
    nodeIds.add(c.targetId);
  });

  const nodeCount = nodeIds.size;
  const edgeCount = connections.length;

  return {
    degreeCentrality: calculateDegreeCentrality(notes, connections),
    betweennessCentrality: calculateBetweennessCentrality(notes, connections),
    inDegreeCentrality: calculateInDegreeCentrality(notes, connections),
    outDegreeCentrality: calculateOutDegreeCentrality(notes, connections),
    shortestPaths: new Map(), // Computed on-demand
    longestPath: findLongestPath(notes, connections),
    density: calculateDensity(nodeCount, edgeCount),
    nodeCount,
    edgeCount,
    stronglyConnectedComponents: findStronglyConnectedComponents(connections),
  };
}
