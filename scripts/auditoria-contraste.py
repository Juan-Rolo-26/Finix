import json,re
from PIL import Image
directory='docs/auditoria-ux-2026-10-10/evidencia'
def luminance(rgb):
    linear=[v/255/12.92 if v/255<=.04045 else ((v/255+.055)/1.055)**2.4 for v in rgb]
    return sum(x*y for x,y in zip(linear,[.2126,.7152,.0722]))
rows=[]
for record in json.load(open(directory+'/contraste-dom.json')):
    image=Image.open(record['raster']).convert('RGB')
    for sample in record['samples']:
        components=[float(v) for v in re.findall(r'[\d.]+',sample['color'])]
        if len(components)<3:continue
        alpha=(components[3] if len(components)>3 else 1)*sample['opacity']
        points=[]
        for fraction in [.1,.5,.9]:
            x=max(0,min(image.width-1,int(sample['x']+sample['width']*fraction)))
            y=max(0,min(image.height-1,int(sample['y']+min(sample['fontSize'],sample['height'])/2)))
            bg=image.getpixel((x,y));fg=tuple(alpha*value+(1-alpha)*base for value,base in zip(components[:3],bg))
            a,b=sorted([luminance(bg),luminance(fg)])
            points.append({'background':bg,'foregroundEffective':[round(v,1) for v in fg],'ratio':round((b+.05)/(a+.05),3)})
        required=3 if sample['fontSize']>=24 or (sample['fontSize']>=18.66 and sample['weight']>=700) else 4.5
        rows.append({'route':record['name'],'theme':record['theme'],**sample,'samples':points,'minimumRatio':min(p['ratio'] for p in points),'required':required,'passes':min(p['ratio'] for p in points)>=required})
json.dump(rows,open(directory+'/contraste-efectivo.json','w'),ensure_ascii=False,indent=2)
print('Muestras:',len(rows),'Fallan:',sum(not r['passes'] for r in rows))
for r in rows:
    if not r['passes']:print(r['route'],r['theme'],r['text'][:70],r['minimumRatio'],r['required'])
