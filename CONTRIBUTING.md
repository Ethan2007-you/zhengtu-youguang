# 开发与协作指南

本项目的网页运行资源和美术源稿都已包含在仓库中。先运行现有版本，再修改对应数据或组件，最后重新生成普通成品与双击版。

## 环境与命令

Node.js 22或更新版本、npm。推荐使用package-lock.json安装一致的依赖：

```sh
npm ci
npm run dev
npm test
npm run build:offline
```

npm test运行剧情和人物演出检查；build:offline包含TypeScript检查、Vite构建和单文件打包。普通开发无需Python。只有重新整理美术源图或制作本地ZIP时，才用到Python；素材整理另需Pillow。

## 修改剧情

1. 编辑src/story-data.json中的台词、选项、即时反馈和回收信息。
2. 涉及资源增减、物品、事件旗标或结局条件时，修改src/story.ts，并更新相应测试。
3. 节点ID和选择ID用于存档重放，调整前先检查src/storage.ts对存档版本和历史记录的处理。
4. 运行npm test，再执行npx tsx scripts/export_story.ts，使完整剧情方案与数据一致。

每场正文目标约200—300字；五章各三场，五次关键抉择与轻量行动有区分。重大历史事件不分支，角色能知道的信息、权限、物件时序与个人后果要能对应。

scripts/rewrite_story.py是最初的剧本生成过程，会覆盖JSON，不是日常修改的必要步骤。

## 修改人物与场景

- public/assets/cast/是运行素材，art/cast-v3/是人物源稿和提示词。
- src/performance.ts配置每句台词／反馈的人物姿态、动作和站位。人物表情分开控制，不共用全员状态。
- src/CastStage.tsx负责图片解码、换图、入退场与动作，src/cast.css负责尺寸和构图。
- src/Scene.tsx负责背景、镜头和天气；剧情结果仍由story.ts决定，不依赖动画是否播放完。
- 更换资源时，检查src/assetUrl.ts与scripts/build-offline.mjs能否把它装入单文件。

要从既有源稿重新导出角色WebP，可安装Pillow并运行：

```sh
python -m pip install Pillow
python scripts/prepare_cast.py
```

该脚本使用经过核查的源稿行间边界。更换源稿尺寸或排布后，应先检查并调整裁取边界，确认头发、手和脚没有被截断；不要把蹲坐画稿拉长成站姿。

## 修改后检查

- 从开场读到一次选择，再查看选择后的即时反馈。
- 打开设置／日志时不能误推进；点击补全与键盘推进正常。
- 在选择前和反馈后分别存档、读档，确认当前台词、人物和物品一致。
- 查看约1440像素桌面与390像素手机构图，尤其是低姿态的脸、手和选项。
- 快速推进、切换场景与减少动态模式下，旧演出能够清理，剧情不受影响。
- 重新生成双击版，确认没有外部脚本、样式或未打包素材。

自动检查能覆盖路径与状态，不能代替真机、画面和历史内容审核；已完成范围见VALIDATION.md。

## 成品与发布

```sh
npm run build:offline
npx tsx scripts/export_story.ts
python scripts/pack_local.py
```

单文件成品位于双击即玩/；普通网站成品位于dist/。本地打包脚本会在仓库旁生成“征途有光-人物演出版”与ZIP，并更新“征途有光-完整开发包.zip”。它不会上传或部署。

GitHub Release另附双击即玩版ZIP与完整开发包ZIP。源码目录的index.html应保留为Vite入口，不能用单文件成品覆盖它后继续开发。

## 提交变更

提交说明写清触发场景、修改后的行为和验证方式。剧情、状态、演出和素材的修改尽量保持可对应；新增依赖时，在README说明名称与用途。保存新的测试结果时区分自动检查、浏览器模拟与真实设备验证。
