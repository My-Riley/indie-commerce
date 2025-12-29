# indie-commerce

使用 [Vendure](https://www.vendure.io/) 和 [Next.js](https://nextjs.org/) 构建的全栈电商应用。

## 项目结构

这是一个使用 npm workspaces 的 monorepo：

```
indie-commerce/
├── apps/
│   ├── server/       # Vendure 后端 (GraphQL API, 管理后台)
│   └── storefront/   # Next.js 前端
└── package.json      # 根工作区配置
```

## 快速开始

### 开发模式

同时启动服务器和前端（开发模式）：

```bash
npm run dev
```

或者分别运行：

```bash
# 仅启动服务器
npm run dev:server

# 仅启动前端
npm run dev:storefront
```

### 访问地址

- **Vendure 管理后台**: http://localhost:3000/dashboard
- **商店 GraphQL API**: http://localhost:3000/shop-api
- **管理 GraphQL API**: http://localhost:3000/admin-api
- **前端商店**: http://localhost:3001

### 管理员凭据

使用以下凭据登录 Vendure 管理后台：

- **用户名**: superadmin
- **密码**: superadmin

## 生产构建

构建所有包：

```bash
npm run build
```

启动生产服务器：

```bash
npm run start
```

## 了解更多

- [Vendure 文档](https://docs.vendure.io)
- [Next.js 文档](https://nextjs.org/docs)
- [Vendure Discord 社区](https://vendure.io/community)
