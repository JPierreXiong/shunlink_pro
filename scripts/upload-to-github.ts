#!/usr/bin/env node

/**
 * GitHub Upload Script
 * 自动上传项目到 GitHub
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const GITHUB_REPO = 'https://github.com/JPierreXiong/shunlink_pro.git';
const BRANCH = 'main';

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = {
    info: 'ℹ️ ',
    success: '✅ ',
    error: '❌ ',
    warn: '⚠️ ',
  };
  console.log(`${icons[type]} ${message}`);
}

function exec(command: string, description: string) {
  try {
    log(`执行: ${description}`, 'info');
    const output = execSync(command, { encoding: 'utf-8' });
    log(`✅ ${description} 成功`, 'success');
    return output;
  } catch (error: any) {
    log(`❌ ${description} 失败: ${error.message}`, 'error');
    throw error;
  }
}

async function uploadToGitHub() {
  console.log('\n🚀 开始上传到 GitHub...\n');

  try {
    // 1. 检查 Git 是否已初始化
    log('检查 Git 仓库...', 'info');
    if (!fs.existsSync('.git')) {
      log('Git 仓库未初始化，正在初始化...', 'warn');
      exec('git init', '初始化 Git 仓库');
      exec(`git remote add origin ${GITHUB_REPO}`, '添加远程仓库');
    } else {
      log('Git 仓库已存在', 'success');
    }
    console.log();

    // 2. 配置 Git 用户
    log('配置 Git 用户...', 'info');
    try {
      exec('git config user.name "LinkFlow AI Bot"', '设置用户名');
      exec('git config user.email "bot@linkflowai.app"', '设置邮箱');
    } catch (error) {
      log('Git 用户配置可能已存在', 'warn');
    }
    console.log();

    // 3. 检查 .gitignore
    log('检查 .gitignore...', 'info');
    const gitignorePath = '.gitignore';
    if (!fs.existsSync(gitignorePath)) {
      log('.gitignore 不存在，正在创建...', 'warn');
      const gitignoreContent = `
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
pnpm-lock.yaml
yarn.lock
package-lock.json

# Build outputs
.next/
out/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.turbo/
`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      log('.gitignore 已创建', 'success');
    } else {
      log('.gitignore 已存在', 'success');
    }
    console.log();

    // 4. 检查敏感信息
    log('检查敏感信息...', 'info');
    const sensitivePatterns = [
      /DATABASE_URL=/,
      /API_KEY=/,
      /SECRET=/,
      /PASSWORD=/,
      /CREEM_API_KEY=/,
    ];

    const filesToCheck = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'scripts/**/*.ts',
    ];

    let foundSensitive = false;
    for (const pattern of sensitivePatterns) {
      try {
        const result = execSync(`grep -r "${pattern.source}" src/ scripts/ 2>/dev/null || true`, {
          encoding: 'utf-8',
        });
        if (result.trim()) {
          log(`⚠️  发现敏感信息: ${pattern.source}`, 'warn');
          foundSensitive = true;
        }
      } catch (error) {
        // 忽略错误
      }
    }

    if (!foundSensitive) {
      log('✅ 未发现敏感信息', 'success');
    }
    console.log();

    // 5. 添加文件
    log('添加文件到 Git...', 'info');
    exec('git add .', '添加所有文件');
    console.log();

    // 6. 提交
    log('提交更改...', 'info');
    const commitMessage = `feat: LinkFlow AI - SEO optimization + E2E testing infrastructure

- Implement breadcrumb navigation with JSON-LD schema
- Add FAQ schema for pricing page
- Create E2E testing infrastructure
- Add automated startup scripts
- Complete documentation and deployment guides
- Support for multiple languages (EN/ZH/FR)
- Creem payment integration ready for production`;

    exec(`git commit -m "${commitMessage}"`, '提交更改');
    console.log();

    // 7. 推送到 GitHub
    log('推送到 GitHub...', 'info');
    exec(`git push -u origin ${BRANCH}`, '推送到 GitHub');
    console.log();

    // 8. 验证上传
    log('验证上传...', 'info');
    const remoteUrl = exec('git remote get-url origin', '获取远程 URL');
    log(`✅ 远程仓库: ${remoteUrl.trim()}`, 'success');
    console.log();

    console.log('='.repeat(70));
    console.log('✨ 上传到 GitHub 成功！');
    console.log('='.repeat(70));
    console.log();
    console.log('📊 上传信息:');
    console.log(`  仓库: ${GITHUB_REPO}`);
    console.log(`  分支: ${BRANCH}`);
    console.log(`  提交信息: feat: LinkFlow AI - Initial release`);
    console.log();
    console.log('🔗 下一步:');
    console.log(`  1. 访问 https://github.com/JPierreXiong/shunlink_pro`);
    console.log(`  2. 验证所有文件已上传`);
    console.log(`  3. 在 Vercel 中导入仓库进行部署`);
    console.log();
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('❌ 上传失败:', error);
    process.exit(1);
  }
}

uploadToGitHub();

