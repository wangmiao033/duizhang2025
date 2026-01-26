# 贡献指南

感谢您对项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告问题

如果发现bug或有功能建议，请：

1. 检查是否已有相关issue
2. 创建新的issue，详细描述问题或建议
3. 提供复现步骤（如果是bug）

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循现有的代码风格
- 添加必要的注释
- 确保代码可以正常运行

### 提交信息规范

提交信息应清晰描述更改内容：

```
类型: 简短描述

详细说明（可选）
```

**类型包括：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**
```
feat: 添加PDF发票导入功能

- 支持从PDF文件名自动解析发票信息
- 新增快速录入功能
- 优化导入流程
```

## 开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/wangmiao033/duizhang2025.git
cd duizhang2025
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
duizhang2025/
├── src/
│   ├── components/      # React组件
│   ├── contexts/        # React Context
│   ├── hooks/          # 自定义Hooks
│   ├── utils/          # 工具函数
│   ├── styles/         # 样式文件
│   ├── App.jsx         # 主应用组件
│   └── main.jsx        # 入口文件
├── public/             # 静态资源
├── dist/               # 构建输出
├── README.md           # 项目说明
├── CHANGELOG.md        # 更新日志
└── package.json        # 项目配置
```

## 功能开发指南

### 添加新功能

1. 在 `src/components/` 创建新组件
2. 在 `App.jsx` 中引入并使用
3. 添加相应的样式文件
4. 更新文档

### 修改现有功能

1. 确保不破坏现有功能
2. 保持代码风格一致
3. 更新相关文档
4. 测试所有相关功能

## 测试

- 手动测试所有功能
- 确保在不同浏览器中正常工作
- 测试响应式设计
- 验证数据持久化

## 问题反馈

如有问题，请通过以下方式反馈：

- 创建 GitHub Issue
- 发送邮件（如果有）
- 在讨论区讨论

## 行为准则

- 尊重所有贡献者
- 接受建设性批评
- 专注于对项目最有利的事情
- 对其他社区成员表示同理心

---

感谢您的贡献！
