import * as core from '@actions/core';
import * as cache from '@actions/cache';
import * as tc from '@actions/tool-cache';
import { HttpClient } from '@actions/http-client';
import * as os from 'os';
import * as path from 'path';

const MANIFEST_URL =
  'https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json';
export const ARCHIVE_BASE_URL =
  'https://storage.googleapis.com/flutter_infra_release/releases/';

export interface FlutterRelease {
  hash: string;
  channel: string;
  version: string;
  archive: string;
}

export interface FlutterManifest {
  current_release: Record<string, string>;
  releases: FlutterRelease[];
}

export interface ResolvedRelease {
  version: string;
  archiveUrl: string;
}

export async function fetchManifest(): Promise<FlutterManifest> {
  const client = new HttpClient('setup-flutter-sdk');
  const response = await client.getJson<FlutterManifest>(MANIFEST_URL);
  if (!response.result) {
    throw new Error(`Failed to fetch Flutter releases manifest from ${MANIFEST_URL}`);
  }
  return response.result;
}

export function resolveRelease(
  manifest: FlutterManifest,
  channel: string,
  version: string,
): ResolvedRelease {
  let release: FlutterRelease | undefined;

  if (version) {
    release = manifest.releases.find(r => r.version === version);
    if (!release) {
      throw new Error(`Flutter version '${version}' not found in the releases manifest.`);
    }
  } else {
    const hash = manifest.current_release[channel];
    if (!hash) {
      throw new Error(
        `Unknown Flutter channel: '${channel}'. Valid channels are: stable, beta, main.`,
      );
    }
    release = manifest.releases.find(r => r.hash === hash);
    if (!release) {
      throw new Error(`Could not find the latest '${channel}' release in the manifest.`);
    }
  }

  return {
    version: release.version,
    archiveUrl: `${ARCHIVE_BASE_URL}${release.archive}`,
  };
}

const VALID_CHANNELS = ['stable', 'beta', 'main'];

async function run(): Promise<void> {
  const channel = core.getInput('channel') || 'stable';
  const version = core.getInput('version');

  if (!version && !VALID_CHANNELS.includes(channel)) {
    throw new Error(
      `Invalid channel '${channel}'. Valid channels are: ${VALID_CHANNELS.join(', ')}.`,
    );
  }

  const manifest = await fetchManifest();
  const resolved = resolveRelease(manifest, channel, version);

  core.info(`Flutter version: ${resolved.version}`);

  const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] ?? os.tmpdir();
  const installBase = path.join(toolCacheDir, 'flutter', resolved.version);
  const flutterRoot = path.join(installBase, 'flutter');
  const cacheKey = `setup-flutter-sdk-linux-${resolved.version}`;

  const cacheHit = await cache.restoreCache([flutterRoot], cacheKey);
  if (cacheHit) {
    core.info('Restored Flutter SDK from cache.');
  } else {
    core.info(`Downloading from ${resolved.archiveUrl} ...`);
    const archivePath = await tc.downloadTool(resolved.archiveUrl);
    await tc.extractTar(archivePath, installBase, 'xJ');
    await cache.saveCache([flutterRoot], cacheKey);
  }

  core.addPath(path.join(flutterRoot, 'bin'));
  core.setOutput('flutter-version', resolved.version);
  core.setOutput('flutter-root', flutterRoot);
}

if (require.main === module) {
  run().catch(core.setFailed);
}
