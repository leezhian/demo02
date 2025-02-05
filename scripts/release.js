const path = require('path');
const fs = require('fs');
const execa = require('execa');
const chalk = require('chalk');
// const { getLatestVersions } = require('./version');
// const semver = require('semver');

const packagesDir = path.resolve(__dirname, '../packages');
/** 依赖类型 */
const DEPENDENCY_TYPES = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
];
/** 包前缀 */
const PACKAGE_PREFIX = 'kim-demo-';

/**
 * 获取包名
 * @param pkgDirPath 包目录路径
 * @returns 包名
 */
function getPackageName(pkgDirPath) {
  const pkgPath = path.join(pkgDirPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkgJson.name;
}

/**
 * 获取目录和包名的映射关系
 * @returns Map<packageDirName, packageName>
 */
function getDirToPkgNameMap() {
  const dirToPkgNameMap = new Map();
  const packages = fs.readdirSync(packagesDir);
  for (const pkg of packages) {
    const pkgDirPath = path.join(packagesDir, pkg);
    const pkgName = getPackageName(pkgDirPath);
    if (pkgName) {
      dirToPkgNameMap.set(pkg, pkgName);
    }
  }
  return dirToPkgNameMap;
}

/**
 * 获取包的依赖关系图
 * @returns Map<packageName, [dependencies]>
 */
function getDependencyGraph() {
  const graph = new Map();
  const packages = fs.readdirSync(packagesDir);

  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = new Set();

      // 分析依赖项
      DEPENDENCY_TYPES.forEach((type) => {
        const dependencies = pkgJson[type] || {};
        Object.keys(dependencies).forEach((dep) => {
          if (dep.startsWith(PACKAGE_PREFIX)) {
            deps.add(dep);
          }
        });
      });

      graph.set(pkgJson.name, Array.from(deps));
    }
  }

  return graph;
}

/**
 * 获取发布顺序
 * @param {Map<packageName, [dependencies]>} graph
 * @returns [packageName]
 */
function getPublishOrder(graph) {
  const visited = new Set();
  const order = [];

  function visit(pkgName) {
    if (visited.has(pkgName)) return;
    visited.add(pkgName);

    const deps = graph.get(pkgName) || [];
    for (const dep of deps) {
      visit(dep);
    }

    order.push(pkgName);
  }

  for (const pkgName of graph.keys()) {
    visit(pkgName);
  }

  return order;
}

// 获取变更的包
async function getChangedPackages() {
  try {
    // 获取最近的版本标签
    const { stdout: lastTag } = await execa('git', [
      'describe',
      '--tags',
      '--abbrev=0',
    ]);
    console.log(`Last version tag: ${lastTag}`);

    // 获取变更的文件列表
    const { stdout: changedFiles } = await execa('git', [
      'diff',
      '--name-only',
      lastTag,
      'HEAD',
    ]);
    const files = changedFiles.split('\n').filter(Boolean);

    console.log('Files changed since last version:', files);
    // const { stdout } = await execa('git', ['diff', '--name-only', 'HEAD~1', 'HEAD']);
    // const files = stdout.split('\n');
    // console.log(files);
    const dirToPkgNameMap = getDirToPkgNameMap();
    const changedPkgNames = new Set();

    files.forEach((file) => {
      if (!file.startsWith('packages/')) return;
      const [, pkgFilePath] = file.split('packages/');
      if (!pkgFilePath) return;

      const [pkgDirName] = pkgFilePath.split('/');
      if (changedPkgNames.has(pkgDirName)) return;

      const pkgName = dirToPkgNameMap.get(pkgDirName);
      if (!pkgName) return;
      changedPkgNames.add(pkgName);
    });

    return Array.from(changedPkgNames);
  } catch (error) {
    console.error('Error getting changed packages:', error);
    return [];
  }
}

async function main() {
  try {
    // 获取依赖图和发布顺序
    const graph = getDependencyGraph();
    const publishOrder = getPublishOrder(graph);

    // 获取变更的包
    const changedPackages = await getChangedPackages();

    if (changedPackages.length <= 0) {
      console.log(chalk.yellow('No packages have changed.'));
      return;
    }

    console.log(chalk.blue('Changed packages:'), changedPackages);

    const { Bumper } = await import('conventional-recommended-bump');
    const bumper = new Bumper(path.join(packagesDir, 'demo-b')).loadPreset('angular')
    const recommendation = await bumper.bump()
    console.log(recommendation);
    // console.log(chalk.blue('Publish order:'), publishOrder);

    // // 按依赖顺序发布包
    // for (const pkg of publishOrder) {
    //   if (changedPackages.includes(pkg)) {
    //     await releasePackage(pkg);
    //   }
    // }
  } catch (error) {
    console.error(chalk.red('Release failed:', error));
    process.exit(1);
  }
}

main();
