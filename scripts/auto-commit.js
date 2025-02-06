const { execSync } = require('node:child_process');
const { getPkgNameAndVersion } = require('./package');

/**
 * 检查是否有未提交的更改
 */
function checkIfChanged(dirPaths) {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if(status.length <= 0) {
    return false;
  }

  const changedFiles = status.split('\n').filter(Boolean);
  return changedFiles.some(file => {
    return dirPaths.some(pkg => {
      return file.includes(pkg)
    })
  })
}

/**
 * 获取时间字符串
 */
function getTimeString() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function autoCommit(dirPaths) {
  // 首先检查是否有更改
  if (!checkIfChanged(dirPaths)) {
    console.log('📝 没有检测到文件更改，跳过提交');
    return;
  }

  const npmPkgVersions = dirPaths.reduce((acc, pkg) => {
    const pkgInfo = getPkgNameAndVersion(pkg);
    if (pkgInfo.name && pkgInfo.version) {
      acc[pkgInfo.name] = pkgInfo.version;
    }
    return acc;
  }, {});

  const defaultMessage = `chore: release ${Object.keys(npmPkgVersions).map(name => `${name}-v${npmPkgVersions[name]}`).join(' ')}`;
  const customMessage = process.argv[2];
  const commitMessage = customMessage 
    ? `${customMessage}`
    : defaultMessage;

  console.log('🚀 开始提交...');

  // 显示将要提交的文件
  const changes = execSync('git status --short', { encoding: 'utf-8' });
  console.log('\n要提交的文件:');
  console.log(changes);

  const rootPkgInfo = getPkgNameAndVersion('');
  const date = getTimeString();

  execSync('git add .', { encoding: 'utf-8' });
  execSync(`git commit -m "${commitMessage}" --no-verify`, { encoding: 'utf-8' });
  
  const tagName = `${rootPkgInfo.name}@${rootPkgInfo.version}-${date}`;
  execSync(`git tag ${tagName}`, { encoding: 'utf-8' });
  console.log(`📌 创建标签: ${tagName}`);
  
  console.log('📤 推送到远程...');
  execSync('git push origin --follow-tags', { encoding: 'utf-8' });

  console.log('✨ 提交完成！');
}

module.exports = autoCommit;