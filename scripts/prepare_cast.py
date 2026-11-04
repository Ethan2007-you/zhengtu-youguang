"""Technical slicing only; each source retains its generated RGBA alpha.

Place source sheets in art/cast-v3/<id>-source.png, then run this script.
Equal cells stay aligned; a kneeling figure is not stretched to standing height.
"""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
poses=['idle','talk','act','soft','hurt','grief']
out=root/'public/assets/cast'
out.mkdir(parents=True,exist_ok=True)
for id in ['shitou','leader','medic','bugler','support']:
    path=root/f'art/cast-v3/{id}-source.png'
    if not path.exists():
        continue
    im=Image.open(path)
    assert im.mode=='RGBA',f'{id}: expected true alpha'
    alpha=im.getchannel('A')
    assert alpha.getextrema()[0]==0 and alpha.getextrema()[1]>200
    w,h=im.size
    # The generator did not place every row boundary at exactly 50%.
    # Splits were checked against alpha occupancy, including hair, hands and feet.
    split={'shitou':724,'leader':718,'medic':736,'bugler':864,'support':692}[id]
    bounds=[0,split,h]
    cells={}
    for row in range(2):
        for col in range(3):
            cell=im.crop((round(col*w/3),bounds[row],round((col+1)*w/3),bounds[row+1]))
            box=cell.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
            assert box,f'{id}: empty cell'
            cells[row,col]=(cell,box)
    # One scale per character preserves head size across standing / seated poses.
    scales={}
    for col in range(3):
        relevant=[(cell,box) for (row,c),(cell,box) in cells.items() if c==col or id!='support']
        scales[col]=min(960/max(b[3]-b[1] for _,b in relevant),510/max(c.width for c,_ in relevant))
    for row in range(2):
        for col in range(3):
            name=(['mother','ama','aunt'][col]+'-'+['idle','act'][row]) if id=='support' else id+'-'+poses[row*3+col]
            target=out/f'{name}.webp'
            if target.exists() and target.stat().st_mtime>=max(path.stat().st_mtime,Path(__file__).stat().st_mtime):
                continue
            cell,box=cells[row,col]
            tile=cell.crop(box);scale=scales[col]
            size=(round(tile.width*scale),round(tile.height*scale))
            tile=tile.resize(size,Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(550,1000))
            x=round((550-cell.width*scale)/2+box[0]*scale)
            canvas.paste(tile,(x,984-size[1]))
            canvas.save(target,quality=91,method=4,exact=True)
            print(name,target.stat().st_size,flush=True)
