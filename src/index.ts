import * as core from '@actions/core';
import * as cache from '@actions/cache';
import * as tc from '@actions/tool-cache';
import { HttpClient } from '@actions/http-client';
import * as os from 'os';
import * as path from 'path';

const MANIFEST_BASE_URL =
  'https://storage.googleapis.com/flutter_infra_release/releases/releases_';
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

export function getManifestUrl(platform: string): string {
  if (platform === 'win32') return `${MANIFEST_BASE_URL}windows.json`;
  if (platform === 'darwin') return `${MANIFEST_BASE_URL}macos.json`;
  return `${MANIFEST_BASE_URL}linux.json`;
}

export function getArchFilter(
  platform: string,
  arch: string,
): ((archive: string) => boolean) | undefined {
  if (platform !== 'darwin') return undefined;
  if (arch === 'arm64') {
    return (archive: string) => archive.includes('arm64');
  }
  return (archive: string) => !archive.includes('arm64');
}

export async function fetchManifest(url: string): Promise<FlutterManifest> {
  const client = new HttpClient('setup-flutter-sdk');
  const response = await client.getJson<FlutterManifest>(url);
  if (!response.result) {
    throw new Error(`Failed to fetch Flutter releases manifest from ${url}`);
  }
  return response.result;
}

export function resolveRelease(
  manifest: FlutterManifest,
  channel: string,
  version: string,
  archFilter?: (archive: string) => boolean,
): ResolvedRelease {
  const matches = (r: FlutterRelease) => !archFilter || archFilter(r.archive);

  let release: FlutterRelease | undefined;

  if (version) {
    release = manifest.releases.find(r => r.version === version && matches(r));
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
    // Resolve the hash to a version, then find the matching architecture.
    const hashRelease = manifest.releases.find(r => r.hash === hash);
    if (!hashRelease) {
      throw new Error(`Could not find the latest '${channel}' release in the manifest.`);
    }
    release = manifest.releases.find(r => r.version === hashRelease.version && matches(r));
    if (!release) {
      throw new Error(
        `Could not find a '${channel}' release for the current architecture in the manifest.`,
      );
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

  const platform = process.platform;
  const arch = process.arch;
  const manifestUrl = getManifestUrl(platform);
  const manifest = await fetchManifest(manifestUrl);
  const archFilter = getArchFilter(platform, arch);
  const resolved = resolveRelease(manifest, channel, version, archFilter);

  core.info(`Flutter version: ${resolved.version}`);

  const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] ?? os.tmpdir();
  const installBase = path.join(toolCacheDir, 'flutter', resolved.version);
  const flutterRoot = path.join(installBase, 'flutter');

  let cacheKey: string;
  if (platform === 'darwin') {
    cacheKey = `setup-flutter-sdk-macos-${arch}-${resolved.version}`;
  } else if (platform === 'win32') {
    cacheKey = `setup-flutter-sdk-windows-${resolved.version}`;
  } else {
    cacheKey = `setup-flutter-sdk-linux-${resolved.version}`;
  }

  const cacheHit = await cache.restoreCache([flutterRoot], cacheKey);
  if (cacheHit) {
    core.info('Restored Flutter SDK from cache.');
  } else {
    core.info(`Downloading from ${resolved.archiveUrl} ...`);
    const archivePath = await tc.downloadTool(resolved.archiveUrl);
    if (platform === 'linux') {
      await tc.extractTar(archivePath, installBase, 'xJ');
    } else {
      await tc.extractZip(archivePath, installBase);
    }
    await cache.saveCache([flutterRoot], cacheKey);
  }

  core.addPath(path.join(flutterRoot, 'bin'));
  core.setOutput('flutter-version', resolved.version);
  core.setOutput('flutter-root', flutterRoot);

  const pubCacheDir = path.join(os.homedir(), '.pub-cache');
  core.exportVariable('PUB_CACHE', pubCacheDir);
  core.addPath(path.join(pubCacheDir, 'bin'));
}

if (require.main === module) {
  run().catch(core.setFailed);
}
