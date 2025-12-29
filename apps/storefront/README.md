<p align="center">
  <a href="https://vendure.io">
    <img alt="Vendure logo" height="60" width="auto" src="https://a.storyblok.com/f/328257/699x480/8dbb4c7a3c/logo-icon.png/m/0x80">
  </a>
</p>
<h1 align="center">
  Vendure Next.js 商店前端启动器
</h1>
<h3 align="center">
    适用于 Vendure 无头电商的 Next.js 16 商店前端启动器
</h3>
<p align="center">
 可作为构建基础、获取灵感，或学习 Vendure Shop API 的使用方法。
</p>
<h4 align="center">
  <a href="https://next.vendure.io">演示</a> |
  <a href="https://docs.vendure.io">文档</a> |
  <a href="https://vendure.io">网站</a>
</h4>

## 功能特性

**身份验证与账户**
- 带邮箱验证的客户注册
- 带会话管理的登录/登出
- 密码重置和修改密码
- 带验证的邮箱地址更新

**客户账户**
- 个人资料管理（姓名、邮箱、密码）
- 地址管理（创建、更新、删除、设置默认）
- 带分页和详细订单视图的订单历史

**商品浏览**
- 商品集合和精选商品
- 带变体和图库的商品详情页
- 带分面筛选的全文搜索
- 分页和排序

**购物车**
- 添加/移除商品，调整数量
- 促销代码支持
- 实时购物车更新和总计

**结账**
- 多步骤流程：配送地址、配送方式、支付、确认
- 已保存地址选择
- 配送方式选择
- 支付集成

**订单管理**
- 订单确认页面
- 带状态的订单跟踪
- 详细的订单信息

## 路线图

- 多货币支持（即将推出）
- 使用 next-intl 的多语言支持（即将推出）

## 快速开始

首先，运行开发服务器：

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3001](http://localhost:3001) 查看结果。

您可以通过修改 `app/page.tsx` 开始编辑页面。页面会在您编辑文件时自动更新。

此项目使用 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) 自动优化和加载 [Geist](https://vercel.com/font)，这是 Vercel 的新字体家族。

## 了解更多

要了解更多关于 Next.js 的信息，请查看以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 的功能和 API。
- [学习 Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程。

您可以查看 [Next.js GitHub 仓库](https://github.com/vercel/next.js) - 欢迎您的反馈和贡献！

## 部署到 Vercel

部署 Next.js 应用最简单的方法是使用 Next.js 创建者提供的 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)。

查看我们的 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多详情。
