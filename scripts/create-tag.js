const { execSync } = require('node:child_process');
const { getPkgNameAndVersion } = require('./package');

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

/**
 * 检查是否有未提交的更改
 */
function checkIfChanged() {
  const log = execSync('git log @{u}..HEAD --oneline', { encoding: 'utf-8' })
  return log.length > 0;
}

async function createTag() {
  // 首先检查是否有更改
  if (!checkIfChanged()) {
    console.log('📝 没有检测到文件更改，跳过提交');
    return;
  }

  const rootPkgInfo = getPkgNameAndVersion('');
  const date = getTimeString();
  
  const tagName = `${rootPkgInfo.name}@${rootPkgInfo.version}-${date}`;
  execSync(`git tag ${tagName}`);
  console.log(`📌 创建标签: ${tagName}`);
  
  console.log('📤 推送到远程...');
  execSync(`git push origin ${tagName}`);
  execSync('git push');

  console.log('✨ 提交完成！');
}

module.exports = createTag;