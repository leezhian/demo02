const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const packages = ['demo-a', 'demo-b'];

async function generateChangelog(pkg) {
  const pkgPath = `packages/${pkg}`;
  const changelogPath = path.join(pkgPath, 'CHANGELOG.md');

  console.log(`正在为 ${pkg} 生成 Changelog...`);

  // 获取包的最新标签版本
  const lastTag = execSync(
    `git describe --tags --abbrev=0 --match "${pkg}@*" 2>/dev/null || echo`,
    { encoding: 'utf-8' }
  ).trim();

  // 构建 conventional-changelog 命令
  const cmd = [
    'conventional-changelog',
    '-p angular',
    `-i ${changelogPath}`,
    '-s',
    lastTag ? `--from=${lastTag}` : '-r 0',
    `--commit-path ${pkgPath}`,
    '--lerna-package', pkg
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${pkg} 的 Changelog 已生成`);
  } catch (err) {
    console.error(`❌ ${pkg} 的 Changelog 生成失败:`, err.message);
  }
}

// 并行生成所有包的 changelog
Promise.all(packages.map(generateChangelog))
  .then(() => console.log('所有 Changelog 生成完成'))
  .catch(console.error);
