#!/usr/bin/env python3
"""Replace Russian text in the image-based PPT PDF with Uzbek, in place."""
import fitz
from PIL import Image, ImageDraw, ImageFont

SRC = "/root/.claude/uploads/ead49f86-ec02-5b16-9488-d5bdecb1bd09/7172c359-________________PPT.pdf"
SCALE = 2.0            # render scale (2x -> 2880x1620)
K = 1.44              # display(2000w) -> render(2880w) factor

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

BLUE = (14, 108, 165)
GRAY = (60, 60, 60)
FOOT = (71, 71, 71)
WHITE = (255, 255, 255)
P_BLUE = (79, 162, 214)
P_PURP = (110, 115, 201)
P_ORNG = (233, 166, 130)
P_TEAL = (74, 173, 163)


def box(dx0, dy0, dx1, dy1):
    return (dx0 * K, dy0 * K, dx1 * K, dy1 * K)


def wrap(draw, text, font, maxw):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_fitted(img, b, text, color, fontpath, align="center",
                max_disp=60, allow_wrap=True, pad=0.90):
    draw = ImageDraw.Draw(img)
    x0, y0, x1, y1 = b
    bw, bh = (x1 - x0) * pad, (y1 - y0)
    max_size = int(max_disp * K)
    for size in range(max_size, 8, -2):
        font = ImageFont.truetype(fontpath, size)
        lines = wrap(draw, text, font, bw) if allow_wrap else [text]
        if not allow_wrap and draw.textlength(text, font=font) > bw:
            continue
        asc, desc = font.getmetrics()
        lh = asc + desc
        gap = int(lh * 0.12)
        total = len(lines) * lh + (len(lines) - 1) * gap
        widest = max(draw.textlength(ln, font=font) for ln in lines)
        if widest <= bw and total <= bh:
            cy = y0 + (bh - total) / 2
            for ln in lines:
                w = draw.textlength(ln, font=font)
                if align == "center":
                    lx = x0 + ((x1 - x0) - w) / 2
                else:
                    lx = x0
                draw.text((lx, cy), ln, font=font, fill=color)
                cy += lh + gap
            return size
    return 0


def cover(img, b, color):
    ImageDraw.Draw(img).rectangle([b[0], b[1], b[2], b[3]], fill=color)


# op = (bg_color, box, text, text_color, fontpath, align, max_disp, wrap)
PAGES = {
    1: [
        (WHITE, box(255, 480, 1775, 695), "Ochilish marosimi", BLUE, BOLD, "center", 105, False),
    ],
    2: [
        (WHITE, box(194, 158, 660, 246), "Kirish", BLUE, BOLD, "left", 46, False),
        (WHITE, box(425, 348, 1575, 668), "Men o'qituvchi va o'quvchilar vakilini tanishtirmoqchiman.", GRAY, BOLD, "center", 60, True),
        (WHITE, box(465, 756, 1535, 858), "o'qituvchi: Yu Changho", BLUE, BOLD, "center", 56, False),
        (WHITE, box(232, 852, 1768, 975), "Talabalar vakili: Ryu Inno", BLUE, BOLD, "center", 56, False),
    ],
    3: [
        (WHITE, box(254, 158, 740, 246), "Koreya", BLUE, BOLD, "left", 46, False),
    ],
    4: [
        (WHITE, box(150, 315, 1850, 428), "Maktabimiz Janubiy Koreyaning Chonju shahrida joylashgan.", GRAY, BOLD, "center", 54, False),
        (P_BLUE, box(70, 490, 432, 560), "Bosh darvoza", WHITE, REG, "center", 34, False),
        (P_PURP, box(560, 474, 932, 560), "Talabalar markazi", WHITE, REG, "center", 32, True),
        (P_ORNG, box(1064, 490, 1440, 560), "kutubxona", WHITE, REG, "center", 34, False),
        (P_TEAL, box(1564, 474, 1940, 560), "Xalqaro markaz", WHITE, REG, "center", 32, True),
        (WHITE, box(628, 902, 1560, 982), "Bular maktabning asosiy binolari.", FOOT, REG, "center", 40, False),
    ],
    5: [
        (WHITE, box(254, 150, 720, 246), "O'quv rejasi", BLUE, BOLD, "left", 46, False),
        (WHITE, box(540, 328, 1460, 422), "Siz to'rtta sohani o'rganasiz.", GRAY, BOLD, "center", 58, False),
        (P_BLUE, box(72, 496, 440, 560), "an'anaviy o'yinlar", WHITE, REG, "center", 30, False),
        (P_ORNG, box(1064, 496, 1440, 560), "taekvondo", WHITE, REG, "center", 34, False),
        (P_TEAL, box(1564, 486, 1940, 560), "koreys tili", WHITE, REG, "center", 34, False),
        (WHITE, box(482, 904, 1620, 978), "Oxirgi kuni siz bilan birga sahnada chiqish qilaman.", FOOT, REG, "center", 40, True),
    ],
    6: [
        (WHITE, box(280, 516, 1740, 684), "Uchrashuvdan xursandman", BLUE, BOLD, "center", 105, False),
    ],
}


def main():
    doc = fitz.open(SRC)
    out_imgs = []
    for i in range(doc.page_count):
        page = doc[i]
        pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE))
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        for (bg, b, text, color, fp, align, mx, wr) in PAGES.get(i + 1, []):
            cover(img, b, bg)
            sz = draw_fitted(img, b, text, color, fp, align, mx, wr)
            if sz == 0:
                print(f"  !! page{i+1}: '{text[:20]}' did not fit")
        img.save(f"pdf_out/page{i+1}.png")
        out_imgs.append(img)
        print(f"page{i+1} done")
    out_imgs[0].save("PPT_uzbek.pdf", save_all=True, append_images=out_imgs[1:], resolution=200.0)
    print("Saved PPT_uzbek.pdf")


if __name__ == "__main__":
    main()
