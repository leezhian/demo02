const fs = require('node:fs');
const path = require('node:path');

/** 依赖类型 */
const DEPENDENCY_TYPES = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

/**
 * 读取 package.json 文件
 * @param {string} dirPath 目录路径
 */
function readPkgJson(dirPath) {
  const pkgPath = path.join(dirPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
}

/**
 * 获取包的名称和版本
 */
function getPkgNameAndVersion(dirPath) {
  if(typeof dirPath !== 'string') {
    throw new Error('dirPath must be a string');
  }
  const packageJsonInfo = readPkgJson(dirPath);
  const packageInfo = {}
  if (!packageJsonInfo) return packageInfo;

  packageInfo.name = packageJsonInfo.name;
  packageInfo.version = packageJsonInfo.version;

  return packageInfo;
}

/**
 * 获取包名和版本映射
 */
function getPkgVersionMap(dirPaths) {
  if(!Array.isArray(dirPaths)) {
    throw new Error('dirPaths must be an array');
  }
  const graph = {};

  for (const pkg of dirPaths) {
    const pkgInfo = getPkgNameAndVersion(pkg);
    if (pkgInfo.name && pkgInfo.version) {
      graph[pkgInfo.name] = pkgInfo.version;
    }
  }

  return graph;
}

/**
 * 获取包的依赖关系图
 * @returns Map<packageName, [dependencies]>
 */
function getDependencyGraph(packagePrefix, dirPaths) {
  const graph = new Map();

  for (const pkg of dirPaths) {
    const pkgJson = readPkgJson(pkg);
    if (pkgJson) {
      const deps = new Set();

      // 分析依赖项
      DEPENDENCY_TYPES.forEach((type) => {
        const dependencies = pkgJson[type] || {};
        Object.keys(dependencies).forEach((dep) => {
          if (dep.startsWith(packagePrefix)) {
            deps.add(dep);
          }
        });
      });

      graph.set(pkgJson.name, Array.from(deps));
    }
  }

  return graph;
}

module.exports = {
  getPkgNameAndVersion,
  getPkgVersionMap,
  getDependencyGraph,
};
