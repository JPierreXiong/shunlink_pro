# 💳 SoloBoard 支付系统区分方案

## 🎯 核心概念

### Creem 的双重角色

#### 角色 1: SoloBoard 收款平台
**用途**: 用户购买 SoloBoard 订阅  
**API Key**: SoloBoard 自己的 Creem 账号  
**数据流**: 用户 → Creem 支付 → SoloBoard 收款  
**存储位置**: `subscription` 表

#### 角色 2: 用户销售额监控
**用途**: 监控用户自己的 Creem 店铺销售额  
**API Key**: 用户提供自己的 Creem API Key  
**数据流**: 用户的 Creem 店铺 → API → SoloBoard 显示  
**存储位置**: `monitored_sites.apiConfig`

---

## 📊 支付方式分类

### 1. SoloBoard 收款（用户付费给我们）

| 支付方式 | 用途 | API Key 所有者 | 配置位置 |
|---------|------|---------------|---------|
| **Creem** | 收取订阅费 | SoloBoard | 环境变量 |
| Stripe | 收取订阅费 | SoloBoard | 环境变量 |
| PayPal | 收取订阅费 | SoloBoard | 环境变量 |

**环境变量**:
```bash
# SoloBoard 收款配置
CREEM_API_KEY=soloboard_creem_key
STRIPE_SECRET_KEY=soloboard_stripe_key
PAYPAL_CLIENT_ID=soloboard_paypal_id
```

### 2. 用户销售额监控（监控用户的收入）

| 平台 | 用途 | API Key 所有者 | 配置位置 |
|------|------|---------------|---------|
| **Creem** | 监控销售额 | 用户 | 站点配置 |
| Stripe | 监控销售额 | 用户 | 站点配置 |
| Lemon Squeezy | 监控销售额 | 用户 | 站点配置 |
| Shopify | 监控销售额 | 用户 | 站点配置 |
| PayPal | 监控销售额 | 用户 | 站点配置 |

**存储位置**: `monitored_sites.apiConfig`

---

## 🔧 技术实现

### 1. 数据库结构

#### subscription 表（SoloBoard 收款）
```typescript
{
  id: string,
  userId: string,
  paymentProvider: 'creem' | 'stripe' | 'paypal',  // SoloBoard 收款方式
  subscriptionId: string,
  planType: 'free' | 'base' | 'pro',
  amount: number,
  currency: string,
  status: 'active' | 'canceled',
  // ... 其他字段
}
```

**说明**: 
- `paymentProvider` 是用户选择的支付方式
- 使用 SoloBoard 的支付账号收款
- 用于解锁功能和权限

#### monitored_sites 表（用户销售额监控）
```typescript
{
  id: string,
  userId: string,
  name: string,
  domain: string,
  apiConfig: {
    // 用户的销售平台配置
    creem?: {
      apiKey: string,           // 用户的 Creem API Key
      storeId: string,          // 用户的店铺 ID
      role: 'revenue_tracking', // 标记用途
    },
    stripe?: {
      apiKey: string,           // 用户的 Stripe API Key
      role: 'revenue_tracking',
    },
    lemonSqueezy?: {
      apiKey: string,
      storeId: string,
      role: 'revenue_tracking',
    },
    shopify?: {
      domain: string,
      accessToken: string,
      role: 'revenue_tracking',
    },
    paypal?: {
      clientId: string,
      clientSecret: string,
      role: 'revenue_tracking',
    },
    ga4?: {
      propertyId: string,
      credentials: string,
      role: 'traffic_tracking',  // 流量监控
    }
  }
}
```

**说明**:
- `apiConfig` 存储用户自己的 API 配置
- 用于监控用户的销售额和流量
- 完全独立于 SoloBoard 收款

---

### 2. 支付流程区分

#### 流程 A: 用户购买 SoloBoard 订阅

```typescript
// src/app/api/payment/create-checkout/route.ts

export async function POST(request: NextRequest) {
  const { planType, paymentProvider } = await request.json();
  
  // 使用 SoloBoard 的支付账号
  const paymentService = await getPaymentService();
  const provider = paymentService.getProvider(paymentProvider);
  
  // 创建支付会话
  const session = await provider.createSubscriptionPayment({
    plan: {
      name: `SoloBoard ${planType} Plan`,
      amount: planType === 'base' ? 999 : 2999,  // $9.99 或 $29.99
      currency: 'USD',
      interval: 'month',
    },
    customer: {
      email: user.email,
    },
    successUrl: `${APP_URL}/payment/success`,
    cancelUrl: `${APP_URL}/payment/cancel`,
  });
  
  // 创建订单记录
  await createOrder({
    userId: user.id,
    paymentProvider,  // 'creem' | 'stripe' | 'paypal'
    planType,
    amount: session.amount,
    // ...
  });
  
  return NextResponse.json({
    checkoutUrl: session.checkoutUrl,
  });
}
```

**关键点**:
- 使用 `process.env.CREEM_API_KEY`（SoloBoard 的 Key）
- 收款到 SoloBoard 账户
- 记录到 `subscription` 表

#### 流程 B: 监控用户的 Creem 销售额

```typescript
// src/shared/services/soloboard/platform-fetchers/creem-fetcher.ts

export async function fetchCreemRevenue(config: {
  apiKey: string,      // 用户的 Creem API Key
  storeId: string,
  dateRange: { start: Date, end: Date }
}) {
  // 使用用户提供的 API Key
  const client = new CreemClient({
    apiKey: config.apiKey,  // 用户的 Key，不是 SoloBoard 的
  });
  
  // 获取用户店铺的销售数据
  const orders = await client.orders.list({
    storeId: config.storeId,
    startDate: config.dateRange.start,
    endDate: config.dateRange.end,
    status: 'paid',
  });
  
  // 计算总收入
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.amount;
  }, 0);
  
  return {
    revenue: totalRevenue,
    orders: orders.length,
    currency: 'USD',
  };
}
```

**关键点**:
- 使用用户提供的 API Key
- 查询用户自己的店铺数据
- 不涉及 SoloBoard 收款

---

### 3. 配置界面区分

#### 界面 A: 订阅管理（/settings/billing）

```typescript
// 用户管理自己的 SoloBoard 订阅
export function BillingPage() {
  const { subscription } = useSubscription();
  
  return (
    <div>
      <h1>Your SoloBoard Subscription</h1>
      
      {/* 当前订阅状态 */}
      <Card>
        <CardTitle>Current Plan</CardTitle>
        <p>Plan: {subscription.planType}</p>
        <p>Price: ${subscription.amount / 100}/month</p>
        <p>Payment Method: {subscription.paymentProvider}</p>
        <p>Status: {subscription.status}</p>
        
        <Button onClick={handleUpgrade}>Upgrade Plan</Button>
        <Button onClick={handleCancel}>Cancel Subscription</Button>
      </Card>
      
      {/* 选择支付方式 */}
      <Card>
        <CardTitle>Payment Method</CardTitle>
        <p>Choose how you want to pay for SoloBoard:</p>
        
        <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
          <Radio value="creem">Creem</Radio>
          <Radio value="stripe">Stripe</Radio>
          <Radio value="paypal">PayPal</Radio>
        </RadioGroup>
      </Card>
    </div>
  );
}
```

**说明**:
- 管理用户的 SoloBoard 订阅
- 选择支付方式（Creem/Stripe/PayPal）
- 钱付给 SoloBoard

#### 界面 B: 站点配置（/soloboard/[siteId]/settings）

```typescript
// 用户配置自己的销售平台
export function SiteSettingsDialog({ siteId }: { siteId: string }) {
  return (
    <Dialog>
      <DialogTitle>Configure Revenue Tracking</DialogTitle>
      
      <Tabs>
        {/* Creem 配置 */}
        <TabPanel label="Creem">
          <FormField label="Your Creem API Key">
            <Input 
              type="password"
              placeholder="Enter your Creem API Key"
              helperText="We'll use this to track revenue from YOUR Creem store"
            />
          </FormField>
          
          <FormField label="Store ID">
            <Input placeholder="Your Creem Store ID" />
          </FormField>
          
          <Alert type="info">
            This is YOUR Creem store data, not your SoloBoard subscription.
          </Alert>
        </TabPanel>
        
        {/* Stripe 配置 */}
        <TabPanel label="Stripe">
          <FormField label="Your Stripe API Key">
            <Input 
              type="password"
              placeholder="sk_live_..."
              helperText="Track revenue from YOUR Stripe account"
            />
          </FormField>
        </TabPanel>
        
        {/* 其他平台... */}
      </Tabs>
      
      <Button onClick={handleSave}>Save Configuration</Button>
    </Dialog>
  );
}
```

**说明**:
- 配置用户自己的销售平台
- 用户提供自己的 API Key
- 用于监控用户的收入

---

## 🔐 安全措施

### 1. API Key 完全隔离

```typescript
// ❌ 错误：混用 API Key
const creemKey = process.env.CREEM_API_KEY;  // SoloBoard 的
const userRevenue = await fetchCreemRevenue({ apiKey: creemKey });  // 错误！

// ✅ 正确：使用用户的 API Key
const site = await getSite(siteId);
const userCreemKey = decrypt(site.apiConfig.creem.apiKey);  // 用户的
const userRevenue = await fetchCreemRevenue({ apiKey: userCreemKey });  // 正确！
```

### 2. 权限验证

```typescript
// 确保用户只能访问自己的数据
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  const site = await getSite(params.siteId);
  
  // 验证所有权
  if (site.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 使用用户自己的 API Key
  const revenue = await fetchCreemRevenue({
    apiKey: decrypt(site.apiConfig.creem.apiKey),  // 用户的 Key
    storeId: site.apiConfig.creem.storeId,
  });
  
  return NextResponse.json({ revenue });
}
```

### 3. 数据加密

```typescript
// 加密存储用户的 API Key
import { encrypt, decrypt } from '@/shared/lib/crypto';

// 保存时加密
export async function PATCH(request: NextRequest) {
  const { creemApiKey, storeId } = await request.json();
  
  await db().update(monitoredSites).set({
    apiConfig: {
      creem: {
        apiKey: encrypt(creemApiKey),  // 加密存储
        storeId: storeId,
        role: 'revenue_tracking',
      }
    }
  }).where(eq(monitoredSites.id, siteId));
}

// 使用时解密
const decryptedKey = decrypt(site.apiConfig.creem.apiKey);
const revenue = await fetchCreemRevenue({ apiKey: decryptedKey });
```

---

## 📋 用户界面文案

### 订阅管理页面

```
标题: Your SoloBoard Subscription
说明: Manage your SoloBoard subscription and billing

当前计划:
- Plan: Base ($9.99/month)
- Payment Method: Creem
- Next Billing Date: 2025-04-09

按钮:
- Upgrade to Pro
- Change Payment Method
- Cancel Subscription
```

### 站点配置页面

```
标题: Revenue Tracking Configuration
说明: Connect your sales platforms to track revenue

Creem 配置:
标题: Your Creem Store
说明: Track revenue from YOUR Creem store (not your SoloBoard subscription)
字段:
- Creem API Key (your store's API key)
- Store ID

提示:
ℹ️ This is for tracking YOUR store's revenue, not for paying SoloBoard.
ℹ️ Your API key is encrypted and secure.

Stripe 配置:
标题: Your Stripe Account
说明: Track revenue from YOUR Stripe account
字段:
- Stripe API Key (sk_live_... or sk_test_...)

提示:
ℹ️ We'll only read your revenue data, we cannot make charges.
```

---

## 🎯 实施清单

### 阶段 1: 数据库调整
- [ ] 在 `apiConfig` 中添加 `role` 字段
- [ ] 更新数据库 schema
- [ ] 生成迁移文件

### 阶段 2: 代码调整
- [ ] 明确区分两种 Creem 使用场景
- [ ] 添加注释说明
- [ ] 更新 API 端点

### 阶段 3: 界面更新
- [ ] 更新订阅管理页面文案
- [ ] 更新站点配置页面文案
- [ ] 添加帮助提示

### 阶段 4: 文档编写
- [ ] 用户文档：如何配置销售平台
- [ ] 开发文档：支付系统架构
- [ ] FAQ：Creem 双重角色说明

### 阶段 5: 测试验证
- [ ] 测试 SoloBoard 收款流程
- [ ] 测试用户销售额监控
- [ ] 验证 API Key 隔离
- [ ] 验证权限控制

---

## 📚 FAQ

### Q1: 为什么 Creem 有两个用途？
**A**: 
- **用途 1**: 用户付费给 SoloBoard（订阅管理）
- **用途 2**: 监控用户自己的 Creem 店铺销售额

这两个用途完全独立，使用不同的 API Key。

### Q2: 用户配置 Creem 会影响订阅吗？
**A**: 不会。用户在站点配置中提供的 Creem API Key 只用于监控销售额，与 SoloBoard 订阅无关。

### Q3: 如果用户同时使用 Creem 付费和监控怎么办？
**A**: 
- 付费：使用 SoloBoard 的 Creem 账号（环境变量）
- 监控：使用用户自己的 Creem API Key（站点配置）
- 两者完全隔离，不会混淆

### Q4: 其他支付方式（Stripe/PayPal）也有双重用途吗？
**A**: 
- **Stripe**: 可以用于 SoloBoard 收款，也可以监控用户销售额
- **PayPal**: 可以用于 SoloBoard 收款，也可以监控用户销售额
- **Lemon Squeezy**: 仅用于监控用户销售额
- **Shopify**: 仅用于监控用户销售额

---

## ✅ 总结

### 核心原则
1. **完全隔离**: SoloBoard 收款和用户销售额监控完全分离
2. **清晰标注**: 代码和界面都明确标注用途
3. **安全第一**: API Key 加密存储，权限严格验证
4. **用户友好**: 界面文案清晰，避免混淆

### 技术要点
- `subscription` 表：SoloBoard 收款
- `monitored_sites.apiConfig`：用户销售额监控
- 环境变量：SoloBoard 的支付账号
- 站点配置：用户的销售平台 API Key

### 下一步
1. 审阅方案
2. 确认实施细节
3. 开始代码调整
4. 更新界面文案
5. 编写用户文档

---

**方案已完成，等待审批！** 💳



