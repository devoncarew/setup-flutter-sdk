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

function compareVersions(a: string, b: string): number {
  const aParts = a.split('.');
  const bParts = b.split('.');
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const av = parseInt(aParts[i] ?? '0', 10);
    const bv = parseInt(bParts[i] ?? '0', 10);
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function resolveRelease(
  manifest: FlutterManifest,
  channel: string,
  version: string,
): ResolvedRelease {
  let release: FlutterRelease | undefined;

  if (version) {
    const matches = manifest.releases.filter(
      r => r.version === version || r.version.startsWith(version + '.'),
    );
    if (matches.length === 0) {
      throw new Error(`Flutter version '${version}' not found in the releases manifest.`);
    }
    release = matches.reduce((best, r) =>
      compareVersions(r.version, best.version) > 0 ? r : best,
    );
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
