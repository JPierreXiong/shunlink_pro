/**
 * Vercel 部署状态检查脚本
 * 用途：验证 Vercel 上的环境变量和 API 是否正常工作
 */

const SOLOBOARD_URL = 'https://www.soloboard.app';

console.log('🔍 开始检查 Vercel 部署状态...\n');
console.log(`📍 目标: ${SOLOBOARD_URL}\n`);

async function checkDeployment() {
  const tests = [];

  // 测试 1: 检查首页
  console.log('📡 测试 1: 检查首页是否可访问...');
  try {
    const response = await fetch(SOLOBOARD_URL);
    const html = await response.text();
    
    if (response.ok) {
      console.log('   ✓ 首页可访问');
      
      // 检查是否还有 "Digital Heirloom" 字样
      if (html.includes('Digital Heirloom')) {
        console.log('   ⚠️  警告: 页面中仍包含 "Digital Heirloom"');
        console.log('   建议: 清除 Vercel 缓存并重新部署');
        tests.push({ name: '首页内容', status: 'warning' });
      } else if (html.includes('SoloBoard')) {
        console.log('   ✓ 页面内容正确 (包含 SoloBoard)');
        tests.push({ name: '首页', status: 'pass' });
      } else {
        console.log('   ⚠️  页面内容可能不正确');
        tests.push({ name: '首页内容', status: 'warning' });
      }
    } else {
      console.log(`   ✗ 首页访问失败 (${response.status})`);
      tests.push({ name: '首页', status: 'fail' });
    }
  } catch (error) {
    console.log(`   ✗ 首页访问错误: ${error.message}`);
    tests.push({ name: '首页', status: 'fail' });
  }
  console.log('');

  // 测试 2: 检查 API 健康状态
  console.log('📡 测试 2: 检查 API 健康状态...');
  try {
    const response = await fetch(`${SOLOBOARD_URL}/api/webhooks/creem`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('   ✓ Webhook API 正常');
      tests.push({ name: 'Webhook API', status: 'pass' });
    } else {
      console.log(`   ⚠️  Webhook API 响应异常`);
      tests.push({ name: 'Webhook API', status: 'warning' });
    }
  } catch (error) {
    console.log(`   ✗ Webhook API 错误: ${error.message}`);
    tests.push({ name: 'Webhook API', status: 'fail' });
  }
  console.log('');

  // 测试 3: 检查数据库连接（通过 API）
  console.log('📡 测试 3: 检查数据库连接...');
  try {
    const response = await fetch(`${SOLOBOARD_URL}/api/soloboard/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      console.log('   ✓ API 正常响应 (需要认证)');
      console.log('   ✓ 数据库连接应该正常');
      tests.push({ name: '数据库连接', status: 'pass' });
    } else if (response.status === 500) {
      const error = await response.text();
      console.log('   ✗ API 返回 500 错误');
      console.log(`   错误信息: ${error.substring(0, 100)}...`);
      tests.push({ name: '数据库连接', status: 'fail' });
    } else {
      console.log(`   ⚠️  API 返回状态码: ${response.status}`);
      tests.push({ name: '数据库连接', status: 'warning' });
    }
  } catch (error) {
    console.log(`   ✗ API 请求错误: ${error.message}`);
    tests.push({ name: '数据库连接', status: 'fail' });
  }
  console.log('');

  // 测试 4: 检查 Sign In 页面
  console.log('📡 测试 4: 检查 Sign In 页面...');
  try {
    const response = await fetch(`${SOLOBOARD_URL}/en/sign-in`);
    
    if (response.ok) {
      console.log('   ✓ Sign In 页面可访问');
      tests.push({ name: 'Sign In 页面', status: 'pass' });
    } else {
      console.log(`   ✗ Sign In 页面访问失败 (${response.status})`);
      tests.push({ name: 'Sign In 页面', status: 'fail' });
    }
  } catch (error) {
    console.log(`   ✗ Sign In 页面错误: ${error.message}`);
    tests.push({ name: 'Sign In 页面', status: 'fail' });
  }
  console.log('');

  // 总结
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 测试结果总结\n');
  
  const passed = tests.filter(t => t.status === 'pass').length;
  const warnings = tests.filter(t => t.status === 'warning').length;
  const failed = tests.filter(t => t.status === 'fail').length;
  
  tests.forEach(test => {
    const icon = test.status === 'pass' ? '✓' : test.status === 'warning' ? '⚠️' : '✗';
    console.log(`   ${icon} ${test.name}`);
  });
  
  console.log('');
  console.log(`   通过: ${passed}/${tests.length}`);
  console.log(`   警告: ${warnings}/${tests.length}`);
  console.log(`   失败: ${failed}/${tests.length}`);
  console.log('═══════════════════════════════════════════════════════');
  
  if (failed > 0) {
    console.log('\n💡 建议:');
    console.log('1. 检查 Vercel 环境变量是否正确配置');
    console.log('2. 在 Vercel Dashboard 查看部署日志');
    console.log('3. 尝试重新部署: vercel --prod');
    console.log('4. 清除 Vercel 缓存');
  } else if (warnings > 0) {
    console.log('\n💡 建议:');
    console.log('1. 检查警告项目');
    console.log('2. 可能需要清除缓存并重新部署');
  } else {
    console.log('\n🎉 所有测试通过！部署正常！');
    console.log('\n下一步:');
    console.log('1. 访问 Sign In 页面测试登录');
    console.log('2. 创建账号并添加第一个站点');
    console.log('3. 配置 Webhook 测试实时数据');
  }
}

// 运行检查
checkDeployment().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});







