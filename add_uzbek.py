#!/usr/bin/env python3
"""Add an Uzbek translation line directly below each Korean text line in the deck."""
import copy
import re
from pptx import Presentation
from lxml import etree

A = "http://schemas.openxmlformats.org/drawingml/2006/main"
def a(tag): return f"{{{A}}}{tag}"

HANGUL = re.compile(r"[가-힣]")
UZ_FONT = "S-Core Dream 3 Light"

# Korean (stripped) -> Uzbek translation
TR = {
    "한국 전통놀이": "Koreyaning an'anaviy o'yinlari",
    "안녕하세요!": "Assalomu alaykum!",
    "한국 명절&기념일 퀴즈": "Koreya bayramlari va xotira kunlari viktorinasi",
    "한국 전통 공예 체험 - 딱지": "Koreya an'anaviy hunarmandchiligi tajribasi – Ddakji",
    "한국 전통 공예 체험 - 탈": "Koreya an'anaviy hunarmandchiligi tajribasi – Niqob (Tal)",
    "활동 소감 나누기": "Faoliyat taassurotlarini o'zaro baham ko'rish",
    "퀴즈": "Viktorina",
    "한국의 설날은 음력 1월 15일이다? ---------------- ( O / X )":
        "Koreyaning Seollal (Yangi yil) bayrami oy taqvimi bo'yicha 1-oyning 15-kunida nishonlanadi. ( O / X )",
    "한국의 추수감사절 이름은?": "Koreyaning shukronalik (hosil) bayramining nomi qanday?",
    "한국은 광복절에 태극기를 건다?  ----------------- ( O / X )":
        "Koreyada Ozodlik kunida (Gwangbokjeol) davlat bayrog'i (Taegukgi) osiladi. ( O / X )",
    "한국은 어린이를 위한 날이 있다? ---------------- ( O / X )":
        "Koreyada bolalarga atalgan maxsus kun bor. ( O / X )",
    "다섯 개의 작고 동그란 돌을 던져 손으로 잡으며 노는 놀이는?":
        "Beshta kichik dumaloq toshni otib, qo'l bilan ilib o'ynaladigan o'yin nima deb ataladi?",
    "팽이치기는 팽이를 오래 돌리는 사람이 이긴다?--------- ( O / X )":
        "Pirildoq (paxmoq) o'yinida uni eng uzoq aylantirgan kishi g'olib bo'ladi. ( O / X )",
    "딱지 만들기": "Ddakji yasash",
    "2장의 딱지종이를 접는 선을 따라 접기": "Ikkita ddakji qog'ozini buklama chiziqlari bo'ylab buklang",
    "제작법 사진 출처: 안녕미술아 유튜브": "Tayyorlash rasmlari manbasi: \"Annyeong Misura\" YouTube kanali",
    "두 장의 딱지종이를 민화가 가운데 오게 겹친 후 뒤집기":
        "Ikkita ddakji qog'ozini naqsh o'rtaga keladigan qilib ustma-ust qo'yib, ag'daring",
    "숫자가 보이도록 놓은 뒤 번호 순서대로 접기":
        "Raqamlar ko'rinib turadigan qilib qo'ygach, raqamlar tartibida buklang",
    "마지막 부분(4번)은 종이 안쪽으로 집어넣기": "Oxirgi qismni (4-raqam) qog'ozning ichiga qistirib qo'ying",
    "딱지치기": "Ddakji o'yini (Ddakjichigi)",
    "가위바위보 하기": "Tosh-qaychi-qog'oz o'ynash",
    "진 사람: 딱지 내려놓기": "Yutqazgan o'yinchi: ddakjisini yerga qo'yadi",
    "이긴 사람: 내 딱지로 상대의 딱지 내려치기": "Yutgan o'yinchi: ddakjisi bilan raqibnikiga uradi",
    "바닥에 놓인 상대방의 딱지를 내 딱지로 쳐서 뒤집거나 선 밖으로 밀어내는 놀이":
        "Yerda turgan raqib ddakjisini o'z ddakjing bilan urib ag'darish yoki chiziqdan tashqariga chiqarish o'yini",
    "상대 딱지가 뒤집어지거나, 바람에 넘어가면 그 딱지를 획득!":
        "Raqib ddakjisi ag'darilsa yoki uchib ketib ag'darilsa, o'sha ddakji seniki bo'ladi!",
    "딱지치기 놀이": "Ddakji o'yini",
    "다같이 딱지를 쳐 봅시다!": "Keling, hammamiz birga ddakji o'ynaymiz!",
    "제한시간: 10분": "Belgilangan vaqt: 10 daqiqa",
    "정해진 시간 안에": "Belgilangan vaqt ichida",
    "상대팀의 딱지를 더 많이 가져와 봅시다!": "raqib jamoaning ddakjilaridan ko'proq yutib olishga harakat qilamiz!",
    "한 팀의 딱지는 최대 2개까지 뺏을 수 있습니다.": "Bitta jamoadan ko'pi bilan 2 tagacha ddakji yutib olish mumkin.",
    "한 팀에게 2개를 빼앗았다면 다른 팀에게 도전!": "Bir jamoadan 2 ta yutib olsangiz, boshqa jamoaga qarshi bellashing!",
    "탈 만들기": "Niqob (Tal) yasash",
    "색종이를 찢고, 오리고, 붙여서 꾸미기": "Rangli qog'ozni yirtib, qirqib va yopishtirib bezang",
    "오늘의 활동 마무리": "Bugungi mashg'ulot yakuni",
    "모두 함께 활동 소감 이야기 나누기": "Hammamiz birgalikda mashg'ulot taassurotlarini muhokama qilamiz",
    "학습 및 활동 내용 요약": "O'rganilgan va bajarilgan ishlar mazmunini umumlashtirish",
    "감사합니다!": "Rahmat!",
}

# (slide_index, shape_id) pairs already translated -> skip
SKIP = {(5, 7)}


def uz_size_cp(k_pt):
    """Uzbek subtitle size in centipoints — fixed at 28pt for all lines."""
    return 2800


def set_typeface(rpr, name):
    for tag in ("latin", "ea", "cs"):
        el = rpr.find(a(tag))
        if el is None:
            el = etree.SubElement(rpr, a(tag))
        el.set("typeface", name)


def insert_spc_before(ppr, cp):
    """Insert <a:spcBef> after lnSpc (schema order) with cp centipoints."""
    spc = etree.Element(a("spcBef"))
    pts = etree.SubElement(spc, a("spcPts"))
    pts.set("val", str(cp))
    lnspc = ppr.find(a("lnSpc"))
    if lnspc is not None:
        lnspc.addnext(spc)
    else:
        ppr.insert(0, spc)


def build_uz_paragraph(src_p, uz_text, uz_cp):
    """Clone the Korean <a:p>, strip to one run carrying the Uzbek text."""
    p = copy.deepcopy(src_p)
    runs = p.findall(a("r"))
    keep = runs[0]
    for r in runs[1:]:
        p.remove(r)
    # set text
    t = keep.find(a("t"))
    t.text = uz_text
    # style the kept run
    rpr = keep.find(a("rPr"))
    rpr.set("sz", str(uz_cp))
    rpr.set("lang", "uz-Latn-UZ")
    for attr in ("err", "spc"):
        if attr in rpr.attrib:
            del rpr.attrib[attr]
    rpr.set("cap", "none")  # template's own Uzbek (slide 5) is mixed-case, not all-caps
    set_typeface(rpr, UZ_FONT)
    # style endParaRPr to match, if present
    epr = p.find(a("endParaRPr"))
    if epr is not None:
        epr.set("sz", str(uz_cp))
        epr.set("cap", "none")
        set_typeface(epr, UZ_FONT)
    # a little breathing room above the Uzbek line
    ppr = p.find(a("pPr"))
    if ppr is None:
        ppr = etree.Element(a("pPr"))
        p.insert(0, ppr)
    insert_spc_before(ppr, int(uz_cp * 0.18))
    return p


EMU_IN = 914400
EMU_PT = 12700

# Wide single-line instruction bars: slide -> list of (bar id, text id).
# These grow downward in place to cover the Korean line + Uzbek subtitle.
WIDE_BARS = {
    8: [(16, 17)], 9: [(15, 16)], 10: [(15, 16)], 11: [(15, 16)],
    12: [(24, 25), (28, 29)], 13: [(17, 18)], 15: [(16, 30)],
}

# Stacked item bars (menu/quiz rows). Each column is resized + re-stacked so
# every bar fully covers its text. items = list of (chip id, bar id, text id)
# top-to-bottom; band = (top_in, bottom_in) vertical range to lay them out in.
ITEM_COLUMNS = {
    2: [
        {"band": (7.10, 13.45), "items": [(15, 14, 23), (17, 16, 24)]},
        {"band": (7.10, 13.45), "items": [(19, 18, 25), (21, 20, 26)]},
    ],
    3: [{"band": (6.75, 13.55), "items": [(16, 15, 19), (18, 17, 20), (22, 21, 23)]}],
    4: [{"band": (6.75, 13.55), "items": [(16, 15, 19), (18, 17, 20), (22, 21, 23)]}],
    12: [{"band": (6.20, 11.90), "items": [(16, 15, 21), (18, 17, 22), (20, 19, 23)]}],
    16: [{"band": (7.05, 13.55), "items": [(15, 14, 19), (17, 16, 20)]}],
}


def _char_frac(ch):
    if ch == " ":
        return 0.28
    if "가" <= ch <= "힣" or ord(ch) > 0x2E00:  # CJK / wide
        return 1.0
    if ch.isupper():
        return 0.62
    return 0.50


def est_lines(text, pt, avail_emu):
    if avail_emu <= 0:
        return 1
    w = sum(_char_frac(c) for c in text) * pt * EMU_PT
    import math as _m
    return max(1, _m.ceil(w / avail_emu))


def _find(slide, sid):
    for sh in slide.shapes:
        if sh.shape_id == sid:
            return sh
    return None


def _tins(txt):
    bp = txt._element.find(".//" + a("bodyPr"))
    return int(bp.get("tIns")) if (bp is not None and bp.get("tIns")) else 45720


def _content_h_emu(txt, avail_emu):
    """Estimated rendered height of all paragraphs, accounting for wrapping."""
    total = 0.0
    for p in txt.text_frame.paragraphs:
        t = "".join(r.text for r in p.runs)
        if not t.strip():
            continue
        pt = p.runs[0].font.size.pt if (p.runs and p.runs[0].font.size) else 28.0
        nlines = est_lines(t, pt, avail_emu)
        total += _line_h_pt(p) * nlines + _spc_bef_pt(p)
    return int(total * EMU_PT)


def _line_h_pt(p, default_size=28.0):
    size = p.runs[0].font.size.pt if (p.runs and p.runs[0].font.size) else default_size
    ls = 1.0
    ppr = p._p.find(a("pPr"))
    if ppr is not None:
        l = ppr.find(a("lnSpc"))
        if l is not None:
            pct = l.find(a("spcPct"))
            if pct is not None:
                ls = int(pct.get("val")) / 100000.0
    return size * 1.2 * ls


def _spc_bef_pt(p):
    ppr = p._p.find(a("pPr"))
    if ppr is not None:
        s = ppr.find(a("spcBef"))
        if s is not None:
            pts = s.find(a("spcPts"))
            if pts is not None:
                return int(pts.get("val")) / 100.0
    return 0.0


def grow_wide_bars(prs):
    """Grow each wide instruction bar downward to cover Korean line + Uzbek."""
    pad = int(0.18 * EMU_IN)
    slides = list(prs.slides)
    for si, pairs in WIDE_BARS.items():
        slide = slides[si - 1]
        for bar_id, txt_id in pairs:
            bar, txt = _find(slide, bar_id), _find(slide, txt_id)
            if bar is None or txt is None:
                print(f"  !! S{si}: wide bar {bar_id}/{txt_id} not found")
                continue
            # widen the text box to the bar width (centered) to minimise wraps
            margin = int(0.30 * EMU_IN)
            new_w = bar.width - 2 * margin
            if new_w > txt.width:
                txt.left = bar.left + margin
                txt.width = new_w
            content_bottom = txt.top + _tins(txt) + _content_h_emu(txt, txt.width)
            new_h = content_bottom + pad - bar.top
            if new_h > bar.height:
                old = bar.height
                bar.height = int(new_h)
                print(f"  S{si} wide bar {bar_id}: {old/EMU_IN:.2f}\" -> {bar.height/EMU_IN:.2f}\"")


def layout_item_columns(prs):
    """Resize and re-stack stacked menu/quiz bars so each covers its text.

    All columns on a slide share one bar height and one set of row positions,
    so multi-column grids (slide 2) stay symmetric and aligned.
    """
    pad = int(0.18 * EMU_IN)
    min_gap = int(0.22 * EMU_IN)
    slides = list(prs.slides)
    for si, cols in ITEM_COLUMNS.items():
        slide = slides[si - 1]
        band_top = int(cols[0]["band"][0] * EMU_IN)
        band_bot = int(cols[0]["band"][1] * EMU_IN)
        band_h = band_bot - band_top
        n = max(len(c["items"]) for c in cols)

        # Resolve shapes, widen text boxes to bar width, measure content heights.
        col_data = []
        all_heights = []
        for col in cols:
            triples = []
            for (c, b, t) in col["items"]:
                chip, bar, txt = _find(slide, c), _find(slide, b), _find(slide, t)
                right = bar.left + bar.width
                new_w = right - txt.left - int(0.28 * EMU_IN)
                if new_w > txt.width:
                    txt.width = int(new_w)
                h = _content_h_emu(txt, txt.width)
                triples.append((chip, bar, txt, h))
                all_heights.append(h)
            col_data.append(triples)

        bar_h = max(all_heights) + 2 * pad
        gap = (band_h - n * bar_h) // (n + 1)
        if gap < min_gap:
            gap = min_gap
            bar_h = (band_h - (n + 1) * gap) // n

        # Shared row Y positions for every column.
        row_tops = [band_top + gap + i * (bar_h + gap) for i in range(n)]
        for triples in col_data:
            for (chip, bar, txt, ch_h), y in zip(triples, row_tops):
                bar.top = y
                bar.height = bar_h
                txt.top = max(y + pad // 2, y + (bar_h - ch_h) // 2 - _tins(txt))
                chip.top = y + (bar_h - chip.height) // 2
                print(f"  S{si} bar {bar.shape_id}: top={y/EMU_IN:.2f}\" h={bar_h/EMU_IN:.2f}\"")


def main():
    prs = Presentation("presentation.pptx")
    added = 0
    missing = set()
    for si, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            if (si, shape.shape_id) in SKIP:
                continue
            tf = shape.text_frame
            # snapshot source paragraph elements first
            src_paras = list(tf.paragraphs)
            for para in src_paras:
                txt = "".join(r.text for r in para.runs)
                if not HANGUL.search(txt):
                    continue
                key = txt.strip().replace("\xa0", " ")
                uz = TR.get(key)
                if uz is None:
                    missing.add(key)
                    continue
                k_pt = para.runs[0].font.size.pt if para.runs[0].font.size else 40.0
                uz_cp = uz_size_cp(k_pt)
                new_p = build_uz_paragraph(para._p, uz, uz_cp)
                para._p.addnext(new_p)
                added += 1
    if missing:
        print("!! MISSING TRANSLATIONS:")
        for m in sorted(missing):
            print("   ", repr(m))
    print(f"Added {added} Uzbek lines.")
    print("Growing wide instruction bars:")
    grow_wide_bars(prs)
    print("Laying out stacked item bars:")
    layout_item_columns(prs)
    prs.save("presentation_uz.pptx")
    print("Saved presentation_uz.pptx")


if __name__ == "__main__":
    main()
