/**
 * Evaluation Harness for APEX Code V2
 * 
 * Orchestrates execution of evaluation graph:
 * 1. Load declarative node specifications and scoring config
 * 2. Topologically sort nodes by dependencies
 * 3. Execute nodes with dependency gating
 * 4. Aggregate weighted scores
 * 5. Generate structured report
 * 
 * Based on: APEX SaaS Evaluation Architecture - Primitives & Harness
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import primitives from './primitives.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_SPECS_PATH = path.join(__dirname, 'node-specs.json');
const SCORING_CONFIG_PATH = path.join(__dirname, 'scoring-config.json');

/**
 * Load JSON configuration file
 */
async function loadJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Topological sort of nodes by dependencies (Kahn's algorithm)
 * Ensures prerequisites are executed before dependent nodes
 * 
 * @param {Array} nodes - Array of NodeSpec objects
 * @returns {Array} Sorted array of nodes
 */
function topologicalSort(nodes) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));

  // Calculate in-degrees
  for (const node of nodes) {
    for (const prereq of node.prereqs || []) {
      if (nodeMap.has(prereq)) {
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      }
    }
  }

  // Enqueue nodes with no dependencies
  const queue = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  // Process nodes in dependency order
  const sorted = [];
  while (queue.length > 0) {
    const id = queue.shift();
    const node = nodeMap.get(id);
    if (node) {
      sorted.push(node);
      // Reduce in-degree for dependent nodes
      for (const dependent of nodes) {
        if ((dependent.prereqs || []).includes(id)) {
          inDegree.set(dependent.id, (inDegree.get(dependent.id) || 0) - 1);
          if (inDegree.get(dependent.id) === 0) {
            queue.push(dependent.id);
          }
        }
      }
    }
  }

  return sorted;
}

/**
 * Normalize score to 0-100 range
 */
function normalizeScore(totalScore, maxScore) {
  if (maxScore === 0) return 0;
  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Execute a single evaluation primitive
 * 
 * @param {Object} primitiveCall - {type, inputs}
 * @returns {Promise<Object>} Primitive execution result
 */
async function executePrimitive(primitiveCall) {
  const { type, inputs } = primitiveCall;
  const handler = primitives[type];
  if (!handler) {
    return { pass: false, error: `Unknown primitive: ${type}` };
  }
  return handler(inputs || {});
}

/**
 * Calculate node score based on primitive results
 * 
 * @param {Object} nodeSpec - Node specification
 * @param {Array} results - Array of primitive results
 * @returns {number} Node score (maxScore if all pass, 0 otherwise)
 */
function calculateNodeScore(nodeSpec, results) {
  const passes = results.every((result) => result.pass);
  return passes ? nodeSpec.scoring.maxScore : 0;
}

/**
 * Main harness execution
 */
async function runHarness() {
  console.log('\n🚀 Starting APEX Evaluation Harness...\n');

  // Load configuration
  const nodeSpecs = await loadJson(NODE_SPECS_PATH);
  const scoringConfig = await loadJson(SCORING_CONFIG_PATH);

  console.log(`Loaded ${nodeSpecs.length} node specifications`);
  console.log(`Loaded scoring config with ${Object.keys(scoringConfig.categories).length} categories\n`);

  // Sort nodes by dependencies
  const sortedNodes = topologicalSort(nodeSpecs);
  console.log('Execution order (topologically sorted):');
  sortedNodes.forEach((node, idx) => {
    const prereqsStr = node.prereqs.length > 0 ? ` (depends on: ${node.prereqs.join(', ')})` : '';
    console.log(`  ${idx + 1}. ${node.id}${prereqsStr}`);
  });
  console.log('');

  // Execute nodes
  const results = [];
  const nodeStatus = new Map();

  for (const node of sortedNodes) {
    console.log(`Executing: ${node.id}`);
    console.log(`  Description: ${node.description}`);

    // Check prerequisites
    const prereqs = node.prereqs || [];
    const unmet = prereqs.filter((id) => nodeStatus.get(id) !== 'PASSED');
    
    if (unmet.length > 0) {
      console.log(`  ⏭️  SKIPPED: Unmet prerequisites: ${unmet.join(', ')}\n`);
      results.push({
        id: node.id,
        status: 'SKIPPED_DEPENDENCY',
        reason: `Unmet prerequisites: ${unmet.join(', ')}`,
        score: 0,
        evidence: []
      });
      nodeStatus.set(node.id, 'SKIPPED');
      continue;
    }

    // Execute primitive chain
    const primitiveResults = [];
    for (const primitiveCall of node.primitive_chain || []) {
      console.log(`  Running primitive: ${primitiveCall.type}`);
      const result = await executePrimitive(primitiveCall);
      primitiveResults.push({ type: primitiveCall.type, result });
      
      // Stop chain execution if primitive fails
      if (!result.pass) {
        console.log(`  ❌ Primitive failed: ${result.error || result.reasoning || 'Unknown reason'}`);
        break;
      } else {
        console.log(`  ✅ Primitive passed`);
      }
    }

    // Calculate node score
    const score = calculateNodeScore(node, primitiveResults.map((r) => r.result));
    const status = score === node.scoring.maxScore ? 'PASSED' : 'FAILED';
    nodeStatus.set(node.id, status);

    console.log(`  Result: ${status} (${score}/${node.scoring.maxScore} points)`);
    console.log('');

    results.push({
      id: node.id,
      status,
      score,
      maxScore: node.scoring.maxScore,
      evidence: primitiveResults
    });
  }

  // Aggregate scores
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const maxScore = results.reduce((sum, result) => sum + (result.maxScore || 0), 0);
  const normalizedScore = normalizeScore(totalScore, maxScore);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    score: normalizedScore,
    totalScore,
    maxScore,
    results,
    scoringConfig
  };

  // Write report to file
  const outputPath = path.join(__dirname, `harness-report-${Date.now()}.json`);
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('═'.repeat(60));
  console.log('EVALUATION HARNESS COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\nNormalized Score: ${normalizedScore}/100`);
  console.log(`Raw Score: ${totalScore}/${maxScore}`);
  console.log('\nNode Results:');
  results.forEach((result) => {
    const icon = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
    console.log(`  ${icon} ${result.id}: ${result.status}`);
  });
  console.log(`\nDetailed report: ${outputPath}\n`);
}

runHarness().catch((error) => {
  console.error('❌ Harness execution failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});

