#!/usr/bin/env node
// Setup for one agent from distribution/agents.json.
//   agent                       list the agents
//   agent <id> [--time 8:00am]  the steps for that agent; for chat and desktop agents, the
//                               setup message (skill pack) to send it
//   agent <id> --message        only the setup message
import { parseArgs } from './lib/paths.mjs';
import { loadRegistry, findAgent, agentDoc, setupMessage, agentsIndex } from './lib/agents.mjs';

const args = parseArgs(process.argv.slice(2));
const registry = loadRegistry();
const id = args._[0];

if (!id) {
  console.log(agentsIndex(registry));
} else {
  const agent = findAgent(registry, id);
  if (!agent) {
    console.error(`Unknown agent "${id}". One of: ${registry.agents.map((a) => a.id).join(', ')}`);
    process.exit(1);
  }
  const time = typeof args.time === 'string' ? args.time : undefined;
  if (args.message) {
    if (agent.skills === 'folder') { console.error(`${agent.label} loads the skills from its skills folder: run \`job-agent install\` instead.`); process.exit(1); }
    process.stdout.write(setupMessage(agent, { time }));
  } else {
    const doc = agentDoc(agent, registry);
    process.stdout.write(time && agent.skills !== 'folder' ? doc.replace(setupMessage(agent).trimEnd(), setupMessage(agent, { time }).trimEnd()) : doc);
  }
}
