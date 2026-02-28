import { resolveRelease, getManifestUrl, FlutterManifest, ARCHIVE_BASE_URL } from './index';

const mockManifest: FlutterManifest = {
  current_release: {
    stable: 'abc123',
    beta: 'def456',
    main: 'ghi789',
  },
  releases: [
    {
      hash: 'old456',
      channel: 'stable',
      version: '3.19.5',
      archive: 'stable/linux/flutter_linux_3.19.5-stable.tar.xz',
    },
    {
      hash: 'abc123',
      channel: 'stable',
      version: '3.19.6',
      archive: 'stable/linux/flutter_linux_3.19.6-stable.tar.xz',
    },
    {
      hash: 'def456',
      channel: 'beta',
      version: '3.20.0-7.1.pre',
      archive: 'beta/linux/flutter_linux_3.20.0-7.1.pre-beta.tar.xz',
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

  it('resolves a partial version (major.minor) to the latest patch release', () => {
    const result = resolveRelease(mockManifest, 'stable', '3.19');
    expect(result.version).toBe('3.19.6');
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
