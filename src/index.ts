import * as core from '@actions/core';

async function run(): Promise<void> {
  const channel = core.getInput('channel') || 'stable';
  const version = core.getInput('version');

  core.info(`channel: ${channel}`);
  if (version) {
    core.info(`version: ${version}`);
  }
}

run().catch(core.setFailed);
