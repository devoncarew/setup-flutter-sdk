import {
  resolveRelease,
  getManifestUrl,
  getArchFilter,
  FlutterManifest,
  ARCHIVE_BASE_URL,
} from './index';

const mockManifest: FlutterManifest = {
  current_release: {
    stable: 'abc123',
    beta: 'def456',
    main: 'ghi789',
  },
  releases: [
    {
      hash: 'abc123',
      channel: 'stable',
      version: '3.19.6',
      archive: 'stable/linux/flutter_linux_3.19.6-stable.tar.xz',
    },
    {
      hash: 'old456',
      channel: 'stable',
      version: '3.19.5',
      archive: 'stable/linux/flutter_linux_3.19.5-stable.tar.xz',
    },
    {
      hash: 'def456',
      channel: 'beta',
      version: '3.20.0-7.1.pre',
      archive: 'beta/linux/flutter_linux_3.20.0-7.1.pre-beta.tar.xz',
    },
  ],
};

// macOS manifest: two entries per version (x64 and arm64), each with its own hash.
const mockMacManifest: FlutterManifest = {
  current_release: { stable: 'mac-x64-abc', beta: 'mac-x64-def' },
  releases: [
    {
      hash: 'mac-x64-abc',
      channel: 'stable',
      version: '3.19.6',
      archive: 'stable/macos/flutter_macos_3.19.6-stable.zip',
    },
    {
      hash: 'mac-arm64-abc',
      channel: 'stable',
      version: '3.19.6',
      archive: 'stable/macos/flutter_macos_arm64_3.19.6-stable.zip',
    },
  ],
};

describe('resolveRelease', () => {
  it('resolves stable channel to the latest stable release', () => {
    const result = resolveRelease(mockManifest, 'stable', '');
    expect(result.version).toBe('3.19.6');
    expect(result.archiveUrl).toBe(
      `${ARCHIVE_BASE_URL}stable/linux/flutter_linux_3.19.6-stable.tar.xz`,
    );
  });

  it('resolves beta channel to the latest beta release', () => {
    const result = resolveRelease(mockManifest, 'beta', '');
    expect(result.version).toBe('3.20.0-7.1.pre');
    expect(result.archiveUrl).toBe(
      `${ARCHIVE_BASE_URL}beta/linux/flutter_linux_3.20.0-7.1.pre-beta.tar.xz`,
    );
  });

  it('resolves an exact version, ignoring channel', () => {
    const result = resolveRelease(mockManifest, 'stable', '3.19.5');
    expect(result.version).toBe('3.19.5');
    expect(result.archiveUrl).toBe(
      `${ARCHIVE_BASE_URL}stable/linux/flutter_linux_3.19.5-stable.tar.xz`,
    );
  });

  it('throws for an exact version not in the manifest', () => {
    expect(() => resolveRelease(mockManifest, 'stable', '9.9.9')).toThrow(
      "Flutter version '9.9.9' not found in the releases manifest.",
    );
  });

  it('throws for an unknown channel', () => {
    expect(() => resolveRelease(mockManifest, 'nightly', '')).toThrow(
      "Unknown Flutter channel: 'nightly'.",
    );
  });

  it('resolves macOS stable channel to x64 release', () => {
    const archFilter = getArchFilter('darwin', 'x64');
    const result = resolveRelease(mockMacManifest, 'stable', '', archFilter);
    expect(result.archiveUrl).toContain('flutter_macos_3.19.6-stable.zip');
    expect(result.archiveUrl).not.toContain('arm64');
  });

  it('resolves macOS stable channel to arm64 release', () => {
    const archFilter = getArchFilter('darwin', 'arm64');
    const result = resolveRelease(mockMacManifest, 'stable', '', archFilter);
    expect(result.archiveUrl).toContain('arm64');
  });

  it('resolves macOS exact version to arm64 release', () => {
    const archFilter = getArchFilter('darwin', 'arm64');
    const result = resolveRelease(mockMacManifest, 'stable', '3.19.6', archFilter);
    expect(result.archiveUrl).toContain('arm64');
  });
});

describe('getManifestUrl', () => {
  it('returns the linux manifest URL for linux', () => {
    expect(getManifestUrl('linux')).toContain('releases_linux.json');
  });

  it('returns the macos manifest URL for darwin', () => {
    expect(getManifestUrl('darwin')).toContain('releases_macos.json');
  });

  it('returns the windows manifest URL for win32', () => {
    expect(getManifestUrl('win32')).toContain('releases_windows.json');
  });
});

describe('getArchFilter', () => {
  it('returns undefined for linux', () => {
    expect(getArchFilter('linux', 'x64')).toBeUndefined();
  });

  it('returns undefined for windows', () => {
    expect(getArchFilter('win32', 'x64')).toBeUndefined();
  });

  it('returns a filter matching arm64 archives on macOS arm64', () => {
    const filter = getArchFilter('darwin', 'arm64');
    expect(filter).toBeDefined();
    expect(filter!('stable/macos/flutter_macos_arm64_3.19.6-stable.zip')).toBe(true);
    expect(filter!('stable/macos/flutter_macos_3.19.6-stable.zip')).toBe(false);
  });

  it('returns a filter excluding arm64 archives on macOS x64', () => {
    const filter = getArchFilter('darwin', 'x64');
    expect(filter).toBeDefined();
    expect(filter!('stable/macos/flutter_macos_3.19.6-stable.zip')).toBe(true);
    expect(filter!('stable/macos/flutter_macos_arm64_3.19.6-stable.zip')).toBe(false);
  });
});
