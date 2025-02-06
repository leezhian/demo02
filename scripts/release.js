const { execSync } = require('node:child_process');
const chalk = require('chalk');
const { getDependencyGraph } = require('./package');
const createTag = require('./create-tag');

/** 包前缀 */
const PACKAGE_PREFIX = 'kim-demo-';
/** 包列表 */
const NPM_PACKAGES = ['packages/demo-a', 'packages/demo-b'];

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

/**
 * 检查是否在主分支上
 */
function isMainBranch() {
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' });
    const allowedBranches = ['main', 'master'];

    return allowedBranches.includes(currentBranch);
  } catch (error) {
    console.error('❌ 检查分支失败:', error);
    return false;
  }
}

/**
 * 发布包
 * @param {string} pkg 包名
 * @param {boolean} isPreRelease 是否为预发布
 */
function releasePackage(pkg, isPreRelease = false) {
  execSync(`pnpm --filter ${pkg} release --ci ${isPreRelease ? '--preRelease=beta' : ''}`, { stdio: 'inherit', encoding: 'utf-8' });
}

async function main() {
  try {
    // 获取依赖图和发布顺序
    const graph = getDependencyGraph(PACKAGE_PREFIX, NPM_PACKAGES);
    const publishOrder = getPublishOrder(graph);

    for (const pkg of publishOrder) {
      releasePackage(pkg, !isMainBranch());
    }

    // 打 tag 提交
    createTag(NPM_PACKAGES);
  } catch (error) {
    console.error(chalk.red('Release failed:', error));
    process.exit(1);
  }
}

main();
