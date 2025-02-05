/*
 * @Author: kim
 * @Description: 
 */
const pacote = require('pacote');

async function getLatestVersions(packageName, limit) {
  try {
    // 配置私有仓库选项
    // const options = {
    //   registry: 'https://your-private-registry.com/',
    // };
    const options = {};

    const manifest = await pacote.manifest(packageName, options);
    const versions = await pacote.packument(packageName, options);
    
    const allVersions = Object.keys(versions.versions).reverse();
    
    return {
      latest: manifest.version,
      versions: allVersions.slice(0, limit)
    };
  } catch (error) {
    console.error(`获取包 ${packageName} 版本信息失败:`, error);
    return {
      latest: null,
      versions: []
    };
  }
}

module.exports = {
  getLatestVersions,
};
