# 人物演出版：素材来源与生成记录

更新：2026年11月4日。本版使用内置image_gen重做人物，全部文件已保存到本地项目；未使用CLI/API路径。人物和场景均为AI情境复原，不是历史照片或服装文物的考据认证。

## 当前人物素材

- art/cast-v3-reference.png：四名核心人物的统一设计参考，重点区分年龄、脸形、身形、服饰与惯常姿态。
- art/cast-v3/shitou-source.png：石头六格源稿。紧张护包、手按胸前说话、蹲下系鞋、稳手递信、扶膝伤痛、捧号嘴悲痛。
- art/cast-v3/leader-source.png：罗守田六格源稿。严厉站姿、核对背带、靠坐递信、神情缓和、负伤与垂眼。
- art/cast-v3/medic-source.png：陈杏六格源稿。留意同伴、俯身倾听、跪下包扎、伸手支撑、风中护袋、收好号嘴。
- art/cast-v3/bugler-source.png：冬生六格源稿。抱碗机灵、笑着催饭、举号、摆弄补绳、捂嘴咳嗽、病中护碗。
- art/cast-v3/support-source.png：母亲、央金阿妈、刘婶三人各两格。分别为编鞋／递鞋、守粮／分粮、端碗／让出歇脚处。
- public/assets/cast/：运行所用30张550×1000透明WebP，四核心人物各六张、三配角各两张。配角的导演标签会复用相应基础姿态，不宣称每人都有六张独立画稿。
- art/cast-v3/PROMPTS.md：上述六次生成的原始提示词，包含参考图和五份姿态图集。

文件名为角色ID加姿态：核心人物使用idle、talk、act、soft、hurt、grief；配角仅idle和act。人物不再共用一张表情行。实际演出可见src/performance.ts，具体姿态不是道德评价。

## 技术整理

scripts/prepare_cast.py使用Pillow做面板裁取、尺寸整理与WebP编码，不重新绘制人物。透明通道来自图像生成。源图的行间边界并非都在50%，已按alpha覆盖检查：冬生的上排较高，母亲递鞋的头部在中线之前；导出使用核实后的边界，避免裁脚或裁头。每个人物统一缩放，保留蹲坐比站立更低的身体关系。没有把蹲坐图拉长冒充站姿。

朝向需要时在网页中镜像，以让目光、递信和支撑的手朝向身边人物。动作通过绘制姿态切换与GSAP小幅进退、递手、支撑过渡呈现；没有完整肢体骨骼或逐帧动作捕捉。

## 场景与材质

继续使用art/shitou-landscapes-source.png拆出的六张本地背景：valley、river、zunyi、snow、marsh、dawn；每景约683×384，宽屏仍有柔化，后续值得逐张提高分辨率。field-cloth.webp继续使用旧布源稿，文字由网页绘制。SVG物件、前景与章节时间示意由代码绘制。系统字体没有打包或转售。

art/shitou-characters-source.png、art/characters-source.png与art/landscapes-source.png是旧版历史源稿；当前人物演出不再使用旧表情图集。保留这些文件供对照，不能把旧版图集数量当作本版实际动作数量。

## 配乐与音效

现版配乐取自 Kevin MacLeod（Incompetech）的现代器乐作品，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。各录音的授权与署名见对应的作曲者页面。

| 场景 | 录音及作者页 | 原录音节选 |
| --- | --- | --- |
| 苏区出发 | [Guzheng City](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN2100001) | 0:01–0:53 |
| 湘江渡口 | [Long Road Ahead B](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100589) | 0:00–0:55 |
| 遵义 | [Eastern Thought](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100682) | 0:12–1:08 |
| 雪山草地 | [Peaceful Desolation](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200017) | 0:01–0:58 |
| 陕北 | [Meditation Impromptu 02](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100162) | 0:00–0:59 |

节选经过单声道转换、频段与响度处理、淡入淡出和 MP3 转码，放在 public/assets/music 下。仅配乐录音及其节选采用上述许可。声音设置内提供同样的署名与链接。曲目用于情境配乐，属于现代创作。

脚步、草绳、纸张、木板、布料、铜扣、碗声和远号由网页合成。剧情编排与播放分别位于 src/audioScore.ts 和 src/soundscape.ts。

## 设计与历史边界

服装装备采用克制、朴素的历史情境设计，人物为原创虚构。央金有自己的家庭与粮食界限，刘婶是陕北另一位群众；不靠夸张民族饰品或统一笑脸区分角色。图像没有替代史料，所有剧情事实与史料出处仍见README及游戏内历史回望。
