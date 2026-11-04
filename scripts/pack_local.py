"""Package the local character-performance edition without remote metadata."""
from pathlib import Path
from shutil import copy2
from zipfile import ZipFile,ZIP_DEFLATED

root=Path(__file__).resolve().parents[1]
stage=(root.parent/'征途有光-人物演出版').resolve()
assert stage.parent==root.parent and stage.name=='征途有光-人物演出版'
selected=[]
for folder in ['src','public','dist','art','tests','双击即玩','docs']:
    selected.extend(p for p in (root/folder).rglob('*') if p.is_file())
for name in ['package.json','package-lock.json','tsconfig.json','index.html','server.mjs',
             '打开征途有光.cmd','README.md','ASSETS.md','VALIDATION.md','TEAM.md','CONTRIBUTING.md','CHANGELOG.md','.gitattributes',
             '石头-五章互动剧情方案.md','.gitignore','scripts/export_story.ts',
             'scripts/rewrite_story.py','scripts/prepare_cast.py','scripts/pack_local.py','scripts/build-offline.mjs']:
    selected.append(root/name)
for source in selected:
    target=stage/source.relative_to(root)
    target.parent.mkdir(parents=True,exist_ok=True)
    copy2(source,target)
archive=root.parent/'征途有光-人物演出版.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for source in selected:
        rel=source.relative_to(root)
        z.write(stage/rel,Path(stage.name)/rel)
with ZipFile(archive) as z:
    assert z.testzip() is None
    names=z.namelist()
    assert not any('/node_modules/' in n or '/.openai/' in n or '/.git/' in n for n in names)
    assert sum(n.startswith(stage.name+'/dist/assets/cast/') for n in names)==30
    assert stage.name+'/src/performance.ts' in names
    assert stage.name+'/src/CastStage.tsx' in names
    assert stage.name+'/art/cast-v3/PROMPTS.md' in names
    launcher=z.read(stage.name+'/打开征途有光.cmd')
    assert launcher.isascii() and b'\r\n' in launcher
    assert b'\n' not in launcher.replace(b'\r\n',b'')
copy2(archive,root.parent/'征途有光-完整开发包.zip')
print('Files:',len(selected),'ZIP bytes:',archive.stat().st_size)
print(archive)
