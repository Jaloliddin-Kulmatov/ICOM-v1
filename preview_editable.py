import translate_pdf as T
from PIL import Image, ImageDraw, ImageFont
from build_editable_pptx import fit_size

LIB_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
LIB_R = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

def draw_box(img, b, text, color, is_bold, align, size_px, wrap):
    d = ImageDraw.Draw(img)
    fp = LIB_B if is_bold else LIB_R
    font = ImageFont.truetype(fp, size_px)
    x0,y0,x1,y1 = b
    bw = (x1-x0)*0.90
    lines = T.wrap(d, text, font, bw) if wrap else [text]
    asc,desc = font.getmetrics(); lh=asc+desc; gap=int(lh*0.12)
    total = len(lines)*lh + (len(lines)-1)*gap
    cy = y0 + ((y1-y0)-total)/2
    for ln in lines:
        w = d.textlength(ln, font=font)
        lx = x0 + ((x1-x0)-w)/2 if align=="center" else x0
        d.text((lx,cy), ln, font=font, fill=color); cy += lh+gap

for i in [1,2,4,5]:
    img = Image.open(f"bg_out/page{i}.png").convert("RGB")
    for (bg,b,text,color,fp,align,mx,wr) in T.PAGES.get(i,[]):
        sz = fit_size(text,b,fp,mx,wr)
        draw_box(img,b,text,color,fp==T.BOLD,align,sz,wr)
    img.save(f"preview_p{i}.png")
print("preview done")
