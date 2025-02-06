const { execSync } = require('node:child_process');
const { getPkgVersionMap, getPkgNameAndVersion } = require('./package');

const NPM_PACKAGES = ['packages/demo-a', 'packages/demo-b'];

/**
 * 执行命令
 * @param {string} command
 */
function execute(command) {
  try {
    return execSync(command, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`执行命令失败: ${command}`);
    return false;
  }
}

/**
 * 检查是否有未提交的更改
 */
function hasChanges() {
  const status = execute('git status --porcelain');
  return status && status.length > 0;
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

async function main() {
  // 首先检查是否有更改
  if (!hasChanges()) {
    console.log('📝 没有检测到文件更改，跳过提交');
    return;
  }

  const npmPkgVersions = getPkgVersionMap(NPM_PACKAGES);
  const defaultMessage = `chore: release ${Object.keys(npmPkgVersions).map(name => `${name}-v${npmPkgVersions[name]}`).join(' ')}`;
  const customMessage = process.argv[2];
  const commitMessage = customMessage 
    ? `${customMessage}`
    : defaultMessage;

  console.log('🚀 开始提交...');

  // 显示将要提交的文件
  const changes = execute('git status --short');
  console.log('\n要提交的文件:');
  console.log(changes);

  const rootPkgInfo = getPkgNameAndVersion('');
  const date = getTimeString();

  execute('git add .');
  execute(`git commit -m "${commitMessage}" --no-verify`);
  
  const tagName = `${rootPkgInfo.name}@${rootPkgInfo.version}-${date}`;
  execute(`git tag ${tagName}`);
  console.log(`📌 创建标签: ${tagName}`);
  
  console.log('📤 推送到远程...');
  execute('git push --follow-tags');

  console.log('✨ 提交完成！');
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});