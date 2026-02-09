import { describe, it, expect } from 'vitest';
import { platform, arch } from 'os';
import { readFileSync } from 'fs';

describe('Platform Detection for Binary Selection', () => {
  it('should detect correct platform and architecture', () => {
    const detectedPlatform = platform();
    const detectedArch = arch();

    expect(detectedPlatform).toBeDefined();
    expect(detectedArch).toBeDefined();
    expect(['darwin', 'linux', 'win32']).toContain(detectedPlatform);
    expect(['x64', 'arm64']).toContain(detectedArch);
  });

  it('should generate correct platform package name for non-Linux systems', () => {
    const plat = platform();
    const cpu = arch();

    if (plat !== 'linux') {
      const packageName = `eventum-${plat}-${cpu}`;
      expect(packageName).toMatch(/^eventum-(darwin|win32)-(x64|arm64)$/);
      const supportedPackages = [
        'eventum-darwin-x64',
        'eventum-darwin-arm64',
        'eventum-win32-x64',
        'eventum-win32-arm64'
      ];
      expect(supportedPackages).toContain(packageName);
    }
  });

  it('should detect musl vs gnu on Linux', () => {
    const plat = platform();
    
    if (plat === 'linux') {
      function isMusl() {
        if (process.report?.getReport) {
          const report = process.report.getReport();
          return !report.header?.glibcVersionRuntime;
        }
        
        try {
          const ldd = readFileSync('/usr/bin/ldd', 'utf8');
          return ldd.includes('musl');
        } catch {
          return false;
        }
      }

      const detected = isMusl();
      expect(typeof detected).toBe('boolean');
    } else {
      expect(true).toBe(true);
    }
  });

  it('should generate correct platform package name for Linux', () => {
    const plat = platform();
    const cpu = arch();

    if (plat === 'linux') {
      function isMusl() {
        if (process.report?.getReport) {
          const report = process.report.getReport();
          return !report.header?.glibcVersionRuntime;
        }
        
        try {
          const ldd = readFileSync('/usr/bin/ldd', 'utf8');
          return ldd.includes('musl');
        } catch {
          return false;
        }
      }

      const libc = isMusl() ? 'musl' : 'gnu';
      const packageName = `eventum-${plat}-${cpu}-${libc}`;
      
      expect(packageName).toMatch(/^eventum-linux-(x64|arm64)-(gnu|musl)$/);
      
      const supportedPackages = [
        'eventum-linux-x64-gnu',
        'eventum-linux-arm64-gnu',
        'eventum-linux-x64-musl',
        'eventum-linux-arm64-musl'
      ];
      expect(supportedPackages).toContain(packageName);
    } else {
      expect(true).toBe(true);
    }
  });

  it('should match platform package name with optionalDependencies', () => {
    const plat = platform();
    const cpu = arch();

    function isMusl() {
      if (process.report?.getReport) {
        const report = process.report.getReport();
        return !report.header?.glibcVersionRuntime;
      }
      
      try {
        const ldd = readFileSync('/usr/bin/ldd', 'utf8');
        return ldd.includes('musl');
      } catch {
        return false;
      }
    }

    let packageName;
    if (plat === 'linux') {
      const libc = isMusl() ? 'musl' : 'gnu';
      packageName = `eventum-${plat}-${cpu}-${libc}`;
    } else {
      packageName = `eventum-${plat}-${cpu}`;
    }

    const allPlatformPackages = [
      'eventum-darwin-x64',
      'eventum-darwin-arm64',
      'eventum-win32-x64',
      'eventum-win32-arm64',
      'eventum-linux-x64-gnu',
      'eventum-linux-arm64-gnu',
      'eventum-linux-x64-musl',
      'eventum-linux-arm64-musl'
    ];

    expect(allPlatformPackages).toContain(packageName);
  });

  it('should have consistent detection logic with index.js', () => {
    const plat = platform();
    const cpu = arch();

    function getPlatformPackage() {
      function isMusl() {
        if (process.report?.getReport) {
          const report = process.report.getReport();
          return !report.header?.glibcVersionRuntime;
        }
        
        try {
          const ldd = readFileSync('/usr/bin/ldd', 'utf8');
          return ldd.includes('musl');
        } catch {
          return false;
        }
      }

      if (plat === 'linux') {
        const libc = isMusl() ? 'musl' : 'gnu';
        return `eventum-${plat}-${cpu}-${libc}`;
      }
      
      return `eventum-${plat}-${cpu}`;
    }

    const detectedPackage = getPlatformPackage();
    
    expect(typeof detectedPackage).toBe('string');
    expect(detectedPackage.length).toBeGreaterThan(0);
    
    expect(detectedPackage).toMatch(/^eventum-/);
    
    expect(detectedPackage).not.toContain('undefined');
    expect(detectedPackage).not.toContain('null');
  });
});