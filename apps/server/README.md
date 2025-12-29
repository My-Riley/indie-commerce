# indie-commerce

此项目使用 [`@vendure/create`](https://github.com/vendure-ecommerce/vendure/tree/master/packages/create) 生成。

有用的链接：

- [Vendure 文档](https://www.vendure.io/docs)
- [Vendure Discord 社区](https://www.vendure.io/community)
- [Vendure GitHub](https://github.com/vendure-ecommerce/vendure)
- [Vendure 插件模板](https://github.com/vendure-ecommerce/plugin-template)

## 目录结构

* `/src` 包含您的 Vendure 服务器源代码。所有自定义代码和插件都应放在这里。
* `/static` 包含静态（非代码）文件，如资源文件（例如上传的图片）和邮件模板。

## 开发

```
npm run dev
```

将从 `src` 目录启动 Vendure 服务器和 [worker](https://www.vendure.io/docs/developer-guide/vendure-worker/) 进程。

## 构建

```
npm run build
```

会将 TypeScript 源代码编译到 `/dist` 目录。

## 生产环境

对于生产环境，有多种可能性，这取决于您的运营需求以及生产托管环境。

### 直接运行

您可以使用 `start` 脚本直接运行构建后的文件：

```
npm run start
```

您也可以考虑使用进程管理器（如 [pm2](https://pm2.keymetrics.io/)）来运行和管理服务器和 worker 进程。

### 使用 Docker

我们包含了一个示例 [Dockerfile](./Dockerfile)，您可以使用以下命令构建：

```
docker build -t vendure .
```

这将构建一个镜像并标记为 "vendure"。然后我们可以这样运行：

```
# 运行服务器
docker run -dp 3000:3000 -e "DB_HOST=host.docker.internal" --name vendure-server vendure npm run start:server

# 运行 worker
docker run -dp 3000:3000 -e "DB_HOST=host.docker.internal" --name vendure-worker vendure npm run start:worker
```

以下是上述命令的说明：

- `docker run` - 运行我们使用 `docker build` 创建的镜像
- `-dp 3000:3000` - `-d` 标志表示以"分离"模式运行，因此它在后台运行且不会占用您的终端。`-p 3000:3000` 表示将容器的 3000 端口（Vendure 默认监听的端口）暴露为主机上的 3000 端口。
- `-e "DB_HOST=host.docker.internal"` - `-e` 选项允许您定义环境变量。在这种情况下，我们将 `DB_HOST` 设置为指向 Docker Desktop 创建的特殊 DNS 名称，该名称指向主机的 IP。请注意，`host.docker.internal` 仅存在于 Docker Desktop 环境中，因此应仅在开发中使用。
- `--name vendure-server` - 我们为容器指定一个人类可读的名称。
- `vendure` - 我们引用构建时设置的标签。
- `npm run start:server` - 最后这部分是在容器内应运行的实际命令。

### Docker Compose

我们包含了一个 [docker-compose.yml](./docker-compose.yml) 文件，其中包含常用服务的配置，如 PostgreSQL、MySQL、MariaDB、Elasticsearch 和 Redis。

要使用 Docker Compose，您需要在机器上安装 Docker。以下是 [Mac](https://docs.docker.com/desktop/install/mac-install/)、[Windows](https://docs.docker.com/desktop/install/windows-install/) 和 [Linux](https://docs.docker.com/desktop/install/linux/) 的安装说明。

您可以使用以下命令启动服务：

```shell
docker-compose up <service>

# 示例：
docker-compose up postgres_db
docker-compose up redis
```

## 插件

在 Vendure 中，您的自定义功能将存在于 [插件](https://www.vendure.io/docs/plugins/) 中。
这些插件应位于 `./src/plugins` 目录中。

要创建新插件，请运行：

```
npx vendure add
```

然后选择 `[Plugin] Create a new Vendure plugin`。

## 数据库迁移

[数据库迁移](https://www.vendure.io/docs/developer-guide/migrations/) 允许安全地更新数据库架构。每当您更改 `customFields` 配置或在插件中定义新实体时，都需要进行迁移。

要生成新的迁移，请运行：

```
npx vendure migrate
```

生成的迁移文件将位于 `./src/migrations/` 目录中，并应提交到源代码控制。
下次启动服务器时，该目录中找到的未完成的迁移将由 [index.ts 文件](./src/index.ts) 中的 `runMigrations()` 函数运行。

如果在初始开发期间，您不希望每次更改 customFields 等时手动生成迁移，可以将 `dbConnectionOptions.synchronize` 设置为 `true`。这将导致数据库架构在每次启动时自动更新，从而无需迁移文件。请注意，一旦您拥有无法丢失的生产数据，**不建议**这样做。

---

您也可以在不启动服务器的情况下，通过 "vendure migrate" 命令手动运行任何待处理的迁移。

---

## 故障排除

### 错误：运行 Vendure 服务器时无法使用 [OS]-x[Architecture] 运行时加载 "sharp" 模块。

- 确保您的 Node 版本是 ^18.17.0 || ^20.3.0 || >=21.0.0 以支持 Sharp 库。
- 确保您的包管理器是最新的。
- **不推荐**：如果以上方法都无法解决问题，请指定您机器的操作系统和架构来安装 sharp。例如：`pnpm install sharp --config.platform=linux --config.architecture=x64` 或 `npm install sharp --os linux --cpu x64`

