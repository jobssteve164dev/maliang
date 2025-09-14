/**
 * 环境工具函数
 */

export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProd = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

export const getAppVersion = (): string => {
  return process.env.npm_package_version || '1.0.0';
};

export const getPlatform = (): NodeJS.Platform => {
  return process.platform;
};

export const isWindows = (): boolean => {
  return process.platform === 'win32';
};

export const isMacOS = (): boolean => {
  return process.platform === 'darwin';
};

export const isLinux = (): boolean => {
  return process.platform === 'linux';
};
