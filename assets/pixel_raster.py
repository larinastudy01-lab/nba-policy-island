"""Project-local, integer-cell SVG rasterizer. Standard library only; no browser.

The supported SVG subset is the project's own paths, primitives, groups and local
use references. Unsupported external resources fail instead of reaching a network.
"""
import math
import re
import struct
import zlib
import xml.etree.ElementTree as ET

IDENTITY = (1, 0, 0, 1, 0, 0)
FONT = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',[
 [14,17,17,31,17,17,17],[30,17,17,30,17,17,30],[14,17,16,16,16,17,14],[30,17,17,17,17,17,30],[31,16,16,30,16,16,31],[31,16,16,30,16,16,16],[14,17,16,23,17,17,15],[17,17,17,31,17,17,17],[14,4,4,4,4,4,14],[7,2,2,2,18,18,12],[17,18,20,24,20,18,17],[16,16,16,16,16,16,31],[17,27,21,21,17,17,17],[17,25,21,19,17,17,17],[14,17,17,17,17,17,14],[30,17,17,30,16,16,16],[14,17,17,17,21,18,13],[30,17,17,30,20,18,17],[15,16,16,14,1,1,30],[31,4,4,4,4,4,4],[17,17,17,17,17,17,14],[17,17,17,17,17,10,4],[17,17,17,21,21,27,17],[17,17,10,4,10,17,17],[17,17,10,4,4,4,4],[31,1,2,4,8,16,31],
 [14,17,19,21,25,17,14],[4,12,4,4,4,4,14],[14,17,1,2,4,8,31],[30,1,1,14,1,1,30],[2,6,10,18,31,2,2],[31,16,16,30,1,1,30],[14,16,16,30,17,17,14],[31,1,2,4,8,8,8],[14,17,17,14,17,17,14],[14,17,17,15,1,1,14]]))
NUM = r"[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?"

def multiply(a, b):
    return (a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5])

def point(m, p):
    return (m[0]*p[0]+m[2]*p[1]+m[4], m[1]*p[0]+m[3]*p[1]+m[5])

def transform(source):
    result = IDENTITY
    for kind, values in re.findall(r"(\w+)\(([^)]+)\)", source or ""):
        v = list(map(float, re.findall(NUM, values)))
        if kind == "matrix": m = tuple(v)
        elif kind == "translate": m = (1, 0, 0, 1, v[0], v[1] if len(v)>1 else 0)
        elif kind == "scale": m = (v[0], 0, 0, v[1] if len(v)>1 else v[0], 0, 0)
        elif kind == "rotate":
            c, s = math.cos(math.radians(v[0])), math.sin(math.radians(v[0]))
            m = (c, s, -s, c, 0, 0)
            if len(v)>2: m = multiply(multiply((1,0,0,1,v[1],v[2]),m),(1,0,0,1,-v[1],-v[2]))
        else: raise ValueError("Unsupported local SVG transform: "+kind)
        result = multiply(result, m)
    return result

def arc(a, rx, ry, angle, large, sweep, b):
    rx, ry = abs(rx), abs(ry)
    if not rx or not ry or a == b: return [b]
    phi = math.radians(angle); co, si = math.cos(phi), math.sin(phi)
    dx, dy = (a[0]-b[0])/2, (a[1]-b[1])/2
    xp, yp = co*dx+si*dy, -si*dx+co*dy
    size = xp*xp/(rx*rx)+yp*yp/(ry*ry)
    if size > 1: rx *= math.sqrt(size); ry *= math.sqrt(size)
    den = rx*rx*yp*yp+ry*ry*xp*xp
    factor = (-1 if bool(large)==bool(sweep) else 1)*math.sqrt(max(0,(rx*rx*ry*ry-den)/den)) if den else 0
    cxp, cyp = factor*rx*yp/ry, -factor*ry*xp/rx
    cx, cy = co*cxp-si*cyp+(a[0]+b[0])/2, si*cxp+co*cyp+(a[1]+b[1])/2
    start = math.atan2((yp-cyp)/ry,(xp-cxp)/rx)
    end = math.atan2((-yp-cyp)/ry,(-xp-cxp)/rx)
    delta = (end-start)%(math.pi*2)
    if not sweep: delta -= math.pi*2
    return [(cx+co*rx*math.cos(start+delta*i/24)-si*ry*math.sin(start+delta*i/24),cy+si*rx*math.cos(start+delta*i/24)+co*ry*math.sin(start+delta*i/24)) for i in range(1,25)]

def path_points(source):
    tokens = re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|"+NUM, source or "")
    paths, current, pos, start, control = [], [], (0.,0.), (0.,0.), None
    i, command, previous = 0, None, None
    arity = dict(M=2,L=2,H=1,V=1,C=6,S=4,Q=4,T=2,A=7)
    while i < len(tokens):
        if tokens[i].isalpha():
            command=tokens[i];i+=1
            if command.upper()=="Z":
                current.append(start);pos=start;paths.append(current);current=[];previous="Z";continue
        upper=command.upper();count=arity[upper];v=list(map(float,tokens[i:i+count]));i+=count
        relative=command.islower();x,y=pos
        def p(j): return (v[j]+(x if relative else 0),v[j+1]+(y if relative else 0))
        if upper=="M":
            if current: paths.append(current)
            pos=p(0);start=pos;current=[pos];command="l" if relative else "L"
        elif upper=="L": pos=p(0);current.append(pos)
        elif upper=="H": pos=(v[0]+(x if relative else 0),y);current.append(pos)
        elif upper=="V": pos=(x,v[0]+(y if relative else 0));current.append(pos)
        elif upper in ("C","S"):
            a=(2*x-control[0],2*y-control[1]) if upper=="S" and previous in ("C","S") else pos
            if upper=="C": a,b,end=p(0),p(2),p(4)
            else: b,end=p(0),p(2)
            for step in range(1,17):
                t=step/16;u=1-t;current.append((u*u*u*x+3*u*u*t*a[0]+3*u*t*t*b[0]+t*t*t*end[0],u*u*u*y+3*u*u*t*a[1]+3*u*t*t*b[1]+t*t*t*end[1]))
            pos=end;control=b
        elif upper in ("Q","T"):
            a=(2*x-control[0],2*y-control[1]) if upper=="T" and previous in ("Q","T") else pos
            if upper=="Q": a,end=p(0),p(2)
            else: end=p(0)
            for step in range(1,17):
                t=step/16;u=1-t;current.append((u*u*x+2*u*t*a[0]+t*t*end[0],u*u*y+2*u*t*a[1]+t*t*end[1]))
            pos=end;control=a
        elif upper=="A":
            end=(v[5]+(x if relative else 0),v[6]+(y if relative else 0));current.extend(arc(pos,*v[:5],end));pos=end
        previous=upper
    if current: paths.append(current)
    return paths

class Raster:
    def __init__(self,width,height): self.width,self.height=width,height;self.data=bytearray(width*height*4)
    def dot(self,x,y,color):
        if not (0<=x<self.width and 0<=y<self.height) or color is None: return
        at=(y*self.width+x)*4;r,g,b,a=color
        if a==255: self.data[at:at+4]=bytes(color);return
        old=self.data[at:at+4];oa=old[3]/255;alpha=a/255;out=alpha+oa*(1-alpha)
        if out: self.data[at:at+4]=bytes([round((v*alpha+old[i]*oa*(1-alpha))/out) for i,v in enumerate((r,g,b))]+[round(out*255)])
    def polygon(self,points,color):
        if len(points)<3 or color is None:return
        for y in range(max(0,math.floor(min(p[1] for p in points))),min(self.height,math.ceil(max(p[1] for p in points)))):
            xs=[]
            for a,b in zip(points,points[1:]+points[:1]):
                if (a[1]<=y+.5<b[1]) or (b[1]<=y+.5<a[1]):xs.append(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]))
            xs.sort()
            for j in range(0,len(xs)-1,2):
                for x in range(max(0,math.ceil(xs[j]-.5)),min(self.width,math.ceil(xs[j+1]-.5))):self.dot(x,y,color)
    def line(self,a,b,color,width=1):
        if color is None:return
        steps=math.ceil(max(abs(b[0]-a[0]),abs(b[1]-a[1])));w=max(1,round(width))
        for i in range(steps+1):
            t=i/steps if steps else 0;x,y=round(a[0]+(b[0]-a[0])*t),round(a[1]+(b[1]-a[1])*t)
            for dy in range(-(w//2),w-w//2):
                for dx in range(-(w//2),w-w//2):self.dot(x+dx,y+dy,color)
    def paste(self,other,x,y,scale=1,flip=False):
        for j in range(other.height):
            for i in range(other.width):
                c=tuple(other.data[(j*other.width+i)*4:(j*other.width+i+1)*4])
                if not c[3]:continue
                for sy in range(scale):
                    for sx in range(scale):self.dot(x+(other.width-1-i if flip else i)*scale+sx,y+j*scale+sy,c)
    def crop(self,x,y,w,h,scale=1):
        result=Raster(w*scale,h*scale)
        for j in range(h):
            for i in range(w):
                if 0<=x+i<self.width and 0<=y+j<self.height:
                    c=tuple(self.data[((y+j)*self.width+x+i)*4:((y+j)*self.width+x+i+1)*4])
                    for dy in range(scale):
                        for dx in range(scale):result.dot(i*scale+dx,j*scale+dy,c)
        return result
    def png(self):
        def chunk(name,data):return struct.pack('!I',len(data))+name+data+struct.pack('!I',zlib.crc32(name+data)&0xffffffff)
        rows=b''.join(b'\0'+self.data[y*self.width*4:(y+1)*self.width*4] for y in range(self.height))
        return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',self.width,self.height,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b'')
    def markup(self):
        rows=[]
        for y in range(self.height):
            x=0
            while x<self.width:
                at=(y*self.width+x)*4;c=tuple(self.data[at:at+4])
                if not c[3]:x+=1;continue
                end=x+1
                while end<self.width and tuple(self.data[(y*self.width+end)*4:(y*self.width+end+1)*4])==c:end+=1
                color='#'+''.join(f'{v:02x}' for v in c[:3]);alpha=f' opacity="{c[3]/255:.3f}"' if c[3]<255 else ''
                rows.append(f'<rect x="{x}" y="{y}" width="{end-x}" height="1" fill="{color}"{alpha}/>');x=end
        return ''.join(rows)
    def svg(self,title):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}" shape-rendering="crispEdges" role="img"><title>{title}</title>{self.markup()}</svg>'

def rasterize(source,width,height):
    root=ET.fromstring(source);out=Raster(width,height);defs={n.get('id'):n for n in root.iter() if n.get('id')}
    def paint(raw,alpha):
        if raw in (None,'none','transparent'):return None
        if raw.startswith('url('):
            node=defs.get(raw[5:-1]);raw=next((n.get('stop-color') or n.get('fill') for n in node.iter() if n.get('stop-color') or n.get('fill')),'#788f85') if node is not None else '#788f85'
        raw={'white':'#ffffff','black':'#000000','gold':'#e7c46f'}.get(raw,raw)
        if raw in ('none','transparent'):return None
        if raw.startswith('#'):
            raw=raw[1:];raw=''.join(c*2 for c in raw) if len(raw) in (3,4) else raw
            rgb=[int(raw[i:i+2],16) for i in (0,2,4)];a=int(raw[6:8],16) if len(raw)==8 else 255
            return tuple(rgb+[round(a*alpha)])
        raise ValueError('Unsupported local SVG color: '+raw)
    def draw(node,m,style):
        tag=node.tag.split('}')[-1]
        if tag in ('defs','title','desc','pattern','linearGradient','radialGradient','clipPath'):return
        a=node.attrib;style={**style,**a};opacity=float(style.get('_opacity',1))*float(a.get('opacity',1));style['_opacity']=opacity
        m=multiply(m,transform(a.get('transform')))
        if tag=='svg':
            vb=list(map(float,re.findall(NUM,a.get('viewBox','0 0 960 640'))));w=float(a.get('width',width)) if node is not root else width;h=float(a.get('height',height)) if node is not root else height
            # map assets explicitly use object-fit:fill, including their source viewBox.
            m=multiply(m,(w/vb[2],0,0,h/vb[3],float(a.get('x',0))-vb[0]*w/vb[2],float(a.get('y',0))-vb[1]*h/vb[3]))
        if tag=='use':
            ref=a.get('href',a.get('{http://www.w3.org/1999/xlink}href',''))
            if not ref.startswith('#'):raise ValueError('External SVG resource rejected')
            draw(defs[ref[1:]],multiply(m,(1,0,0,1,float(a.get('x',0)),float(a.get('y',0)))),style);return
        paths=[]
        def f(k,d=0):return float(a.get(k,d))
        if tag=='path':paths=path_points(a.get('d',''))
        elif tag=='rect':
            x,y,w,h=f('x'),f('y'),f('width'),f('height');paths=[[(x,y),(x+w,y),(x+w,y+h),(x,y+h),(x,y)]]
        elif tag in ('ellipse','circle'):
            cx,cy=f('cx'),f('cy');rx=f('r') if tag=='circle' else f('rx');ry=f('r') if tag=='circle' else f('ry');paths=[[(cx+rx*math.cos(i*math.pi/32),cy+ry*math.sin(i*math.pi/32)) for i in range(65)]]
        elif tag in ('polyline','polygon'):
            v=list(map(float,re.findall(NUM,a.get('points',''))));p=list(zip(v[::2],v[1::2]));paths=[p+([p[0]] if tag=='polygon' and p else [])]
        elif tag=='line':paths=[[(f('x1'),f('y1')),(f('x2'),f('y2'))]]
        elif tag=='image':raise ValueError('External image rejected by offline pixel renderer')
        fill=paint(style.get('fill','#000000'),opacity*float(style.get('fill-opacity',1)));stroke=paint(style.get('stroke','none'),opacity*float(style.get('stroke-opacity',1)));sw=float(style.get('stroke-width',1))*math.sqrt(abs(m[0]*m[3]-m[1]*m[2]))
        if tag=='text':
            text=''.join(node.itertext()).upper();unit=float(style.get('font-size',12))/8;x=f('x');y=f('y')-7*unit
            if style.get('text-anchor')=='middle':x-=len(text)*6*unit/2
            if style.get('text-anchor')=='end':x-=len(text)*6*unit
            for char in text:
                for row,bits in enumerate(FONT.get(char,[0]*7)):
                    for col in range(5):
                        if bits&(1<<(4-col)):
                            px,py=x+col*unit,y+row*unit;out.polygon([point(m,p) for p in [(px,py),(px+unit,py),(px+unit,py+unit),(px,py+unit)]],fill)
                x+=6*unit
        for p in paths:
            pts=[point(m,v) for v in p];out.polygon(pts,fill)
            if stroke:
                for v,w in zip(pts,pts[1:]):out.line(v,w,stroke,sw)
        for child in node:draw(child,m,style)
    draw(root,IDENTITY,{})
    return out
