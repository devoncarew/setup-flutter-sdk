import * as core from '@actions/core';
import * as cache from '@actions/cache';
import * as tc from '@actions/tool-cache';
import { HttpClient } from '@actions/http-client';
import * as os from 'os';
import * as path from 'path';
import { getManifestUrl, resolveRelease, ARCHIVE_BASE_URL, FlutterManifest } from './flutter';

async function fetchManifest(url: string): Promise<FlutterManifest> {
  const client = new HttpClient('setup-flutter-action');
  const response = await client.getJson<FlutterManifest>(url);
  if (!response.result) {
    throw new Error(`Failed to fetch Flutter releases manifest from ${url}`);
  }
  return response.result;
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
  const resolved = resolveRelease(manifest, channel, version);

  core.info(`Flutter version: ${resolved.version}`);

  // On macOS the manifest has separate entries for arm64 and x64. Select the
  // archive that matches the current architecture.
  let archiveUrl = resolved.archiveUrl;
  if (platform === 'darwin') {
    const isArm = arch === 'arm64';
    const archRelease = manifest.releases.find(
      r => r.version === resolved.version && isArm === r.archive.includes('arm64'),
    );
    if (archRelease) {
      archiveUrl = `${ARCHIVE_BASE_URL}${archRelease.archive}`;
    }
  }

  const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] ?? os.tmpdir();
  const installBase = path.join(toolCacheDir, 'flutter', resolved.version);
  const flutterRoot = path.join(installBase, 'flutter');

  let cacheKey: string;
  if (platform === 'darwin') {
    cacheKey = `setup-flutter-macos-${arch}-${resolved.version}`;
  } else if (platform === 'win32') {
    cacheKey = `setup-flutter-windows-${resolved.version}`;
  } else {
    cacheKey = `setup-flutter-linux-${resolved.version}`;
  }

  const cacheHit = await cache.restoreCache([flutterRoot], cacheKey);
  if (cacheHit) {
    core.info('Restored Flutter SDK from cache.');
  } else {
    core.info(`Downloading from ${archiveUrl} ...`);
    const archivePath = await tc.downloadTool(archiveUrl);
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

run().catch(core.setFailed);
