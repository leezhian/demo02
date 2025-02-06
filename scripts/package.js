const fs = require('node:fs');
const path = require('node:path');

/**
 * 获取包的名称和版本
 */
function getPkgNameAndVersion(dirPath) {
  if(typeof dirPath !== 'string') {
    throw new Error('dirPath must be a string');
  }
  const pkgPath = path.join(dirPath, 'package.json');
  const packageInfo = {}
  if (!fs.existsSync(pkgPath)) return packageInfo;

  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  packageInfo.name = pkgJson.name;
  packageInfo.version = pkgJson.version;

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

module.exports = {
  getPkgNameAndVersion,
  getPkgVersionMap,
};
