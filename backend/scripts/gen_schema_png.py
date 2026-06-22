#!/usr/bin/env python3
"""Génère un schéma de base de données (PNG) à partir de la définition des tables.
Rendu maison avec Pillow (supersampling x2 pour la netteté)."""
from PIL import Image, ImageDraw, ImageFont

S = 2  # facteur de supersampling
OUT = "db-schema.png"

# ─── Polices ───────────────────────────────────────────────────────────────────
def font(path_list, size):
    for p in path_list:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

REG = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
BLD = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
f_title = font(BLD, 30 * S)
f_head  = font(BLD, 15 * S)
f_col   = font(REG, 12 * S)
f_colb  = font(BLD, 12 * S)
f_badge = font(BLD, 9 * S)
f_small = font(REG, 11 * S)

# ─── Couleurs ──────────────────────────────────────────────────────────────────
BG       = (247, 247, 251)
HUB      = (79, 70, 229)    # users
LINK     = (139, 92, 246)   # table de liaison
DATA     = (14, 165, 233)   # données patient
REF      = (245, 158, 11)   # référentiel
ROW_A    = (255, 255, 255)
ROW_B    = (244, 245, 250)
TXT      = (30, 30, 40)
MUTED    = (120, 120, 135)
EDGE     = (150, 150, 165)
PK_C     = (217, 164, 6)
FK_C     = (37, 99, 235)
UK_C     = (22, 163, 74)

# ─── Définition des tables : (col, type, badge) ────────────────────────────────
def T(name, color, cols):
    return {"name": name, "color": color, "cols": cols}

tables = {
 "users": T("users", HUB, [
    ("id","uuid","PK"),("email","text","UK"),("password_hash","text",""),
    ("role","text  (patient|professional)",""),("display_name","text",""),
    ("invite_code","text","UK"),("created_at","timestamptz",""),("updated_at","timestamptz",""),
 ]),
 "patient_professional_links": T("patient_professional_links", LINK, [
    ("id","uuid","PK"),("patient_id","uuid","FK"),("professional_id","uuid","FK"),
    ("created_at","timestamptz",""),("UNIQUE","(patient_id, professional_id)",""),
 ]),
 "journal_entries": T("journal_entries", DATA, [
    ("id","uuid","PK"),("user_id","uuid","FK"),("title","text",""),("body","text",""),
    ("mood_score","int  (1..5)",""),("is_shared","boolean  def false",""),
    ("created_at","timestamptz",""),("updated_at","timestamptz",""),
 ]),
 "mood_logs": T("mood_logs", DATA, [
    ("id","uuid","PK"),("user_id","uuid","FK"),("logged_date","date",""),
    ("mood_score","int  (1..5)",""),("note","text",""),("is_shared","boolean  def true",""),
    ("created_at","timestamptz",""),("UNIQUE","(user_id, logged_date)",""),
 ]),
 "questionnaires": T("questionnaires", REF, [
    ("id","uuid","PK"),("slug","text","UK"),("title","text",""),
    ("description","text",""),("schema","jsonb",""),("created_at","timestamptz",""),
 ]),
 "questionnaire_submissions": T("questionnaire_submissions", DATA, [
    ("id","uuid","PK"),("user_id","uuid","FK"),("questionnaire_id","uuid","FK"),
    ("answers","jsonb",""),("score","int",""),("summary","text",""),
    ("is_shared","boolean  def true",""),("created_at","timestamptz",""),
 ]),
 "activities": T("activities", REF, [
    ("id","uuid","PK"),("slug","text","UK"),("title","text",""),
    ("type","text  (breathing|...)",""),("duration_seconds","int",""),
    ("body","text",""),("audio_url","text",""),("created_at","timestamptz",""),
 ]),
 "activity_sessions": T("activity_sessions", DATA, [
    ("id","uuid","PK"),("user_id","uuid","FK"),("activity_id","uuid","FK"),
    ("completed_at","timestamptz",""),
 ]),
 "reminders": T("reminders", DATA, [
    ("id","uuid","PK"),("user_id","uuid","FK"),("title","text",""),("body","text",""),
    ("scheduled_at","timestamptz",""),("recurrence","text",""),("enabled","boolean  def true",""),
    ("notification_id","text",""),("created_at","timestamptz",""),
 ]),
 "help_contacts": T("help_contacts", REF, [
    ("id","uuid","PK"),("region","text",""),("category","text",""),("title","text",""),
    ("phone","text",""),("url","text",""),("sort_order","int  def 0",""),
    ("created_at","timestamptz",""),("UNIQUE","(category, title)",""),
 ]),
}

# Position (col, row) dans une grille 4 x 3
grid = {
 "users": (0,0), "patient_professional_links": (1,0), "journal_entries": (2,0), "mood_logs": (3,0),
 "questionnaires": (0,1), "questionnaire_submissions": (1,1), "activities": (2,1), "activity_sessions": (3,1),
 "reminders": (0,2), "help_contacts": (1,2),
}

# Relations FK : (table_enfant, colonne, table_parent)
fks = [
 ("patient_professional_links","patient_id","users"),
 ("patient_professional_links","professional_id","users"),
 ("journal_entries","user_id","users"),
 ("mood_logs","user_id","users"),
 ("questionnaire_submissions","user_id","users"),
 ("questionnaire_submissions","questionnaire_id","questionnaires"),
 ("activity_sessions","user_id","users"),
 ("activity_sessions","activity_id","activities"),
 ("reminders","user_id","users"),
]

# ─── Géométrie ─────────────────────────────────────────────────────────────────
BOXW   = 372 * S
HEADH  = 40 * S
ROWH   = 26 * S
PAD    = 12 * S
COL_X  = [60*S, 510*S, 960*S, 1410*S]
ROW_Y  = [120*S, 560*S, 980*S]
CANVAS = (1840*S, 1320*S)

def box_rect(name):
    c, r = grid[name]
    x0 = COL_X[c]; y0 = ROW_Y[r]
    h = HEADH + len(tables[name]["cols"]) * ROWH + PAD
    return (x0, y0, x0 + BOXW, y0 + h)

def center(name):
    x0,y0,x1,y1 = box_rect(name)
    return ((x0+x1)//2, (y0+y1)//2)

def clip(cx, cy, px, py, name):
    """Point sur le bord de la boîte `name` en direction de (px,py)."""
    x0,y0,x1,y1 = box_rect(name)
    hw = (x1-x0)/2; hh = (y1-y0)/2
    dx = px-cx; dy = py-cy
    sx = hw/abs(dx) if dx else 1e9
    sy = hh/abs(dy) if dy else 1e9
    s = min(sx, sy)
    return (cx+dx*s, cy+dy*s)

img = Image.new("RGB", CANVAS, BG)
d = ImageDraw.Draw(img)

# Titre
d.text((60*S, 40*S), "Ochitsu — Schéma de base de données (PostgreSQL)", font=f_title, fill=TXT)

# ─── Relations (dessinées avant les boîtes) ────────────────────────────────────
for child, col, parent in fks:
    ccx, ccy = center(child); pcx, pcy = center(parent)
    sx, sy = clip(ccx, ccy, pcx, pcy, child)
    ex, ey = clip(pcx, pcy, ccx, ccy, parent)
    d.line([(sx,sy),(ex,ey)], fill=EDGE, width=2*S)
    # tête de flèche vers le parent
    import math
    ang = math.atan2(ey-sy, ex-sx); L = 11*S; w = 0.4
    d.polygon([(ex,ey),
               (ex-L*math.cos(ang-w), ey-L*math.sin(ang-w)),
               (ex-L*math.cos(ang+w), ey-L*math.sin(ang+w))], fill=FK_C)
    # point côté enfant
    d.ellipse([sx-3*S,sy-3*S,sx+3*S,sy+3*S], fill=FK_C)

# ─── Boîtes ────────────────────────────────────────────────────────────────────
def rounded(xy, rad, fill=None, outline=None, w=1):
    d.rounded_rectangle(xy, radius=rad, fill=fill, outline=outline, width=w)

badge_col = {"PK":PK_C, "FK":FK_C, "UK":UK_C}

for name, t in tables.items():
    x0,y0,x1,y1 = box_rect(name)
    # ombre
    rounded((x0+3*S,y0+4*S,x1+3*S,y1+4*S), 14*S, fill=(225,225,232))
    rounded((x0,y0,x1,y1), 14*S, fill=ROW_A, outline=(210,210,220), w=2)
    # en-tête
    d.rounded_rectangle((x0,y0,x1,y0+HEADH), radius=14*S, fill=t["color"])
    d.rectangle((x0,y0+HEADH-14*S,x1,y0+HEADH), fill=t["color"])
    d.text((x0+14*S, y0+11*S), t["name"], font=f_head, fill=(255,255,255))
    # colonnes
    cy = y0 + HEADH
    for i,(cname,ctype,badge) in enumerate(t["cols"]):
        rowcol = ROW_A if i % 2 == 0 else ROW_B
        d.rectangle((x0,cy,x1,cy+ROWH), fill=rowcol)
        is_constraint = cname in ("UNIQUE",)
        nf = f_colb if badge in ("PK","FK") else f_col
        ncolor = MUTED if is_constraint else TXT
        d.text((x0+14*S, cy+6*S), cname, font=(f_small if is_constraint else nf), fill=ncolor)
        # type
        d.text((x0+150*S, cy+6*S), ctype, font=f_small, fill=MUTED)
        # badge
        if badge:
            bw = 26*S
            bx1 = x1-12*S; bx0 = bx1-bw
            d.rounded_rectangle((bx0,cy+4*S,bx1,cy+ROWH-4*S), radius=5*S, fill=badge_col[badge])
            tw = d.textlength(badge, font=f_badge)
            d.text((bx0+(bw-tw)/2, cy+7*S), badge, font=f_badge, fill=(255,255,255))
        cy += ROWH
    d.line((x0,y1-PAD,x1,y1-PAD), fill=(235,235,240), width=1)

# ─── Légende ───────────────────────────────────────────────────────────────────
lx, ly = 960*S, 1180*S
items = [("PK  clé primaire", PK_C), ("FK  clé étrangère", FK_C), ("UK  unique", UK_C),
         ("users (hub)", HUB), ("liaison", LINK), ("données patient", DATA), ("référentiel", REF)]
d.text((lx, ly-34*S), "Légende", font=f_head, fill=TXT)
cxp = lx
for label,c in items:
    d.rounded_rectangle((cxp, ly, cxp+18*S, ly+18*S), radius=4*S, fill=c)
    d.text((cxp+24*S, ly+1*S), label, font=f_small, fill=TXT)
    cxp += int(d.textlength(label, font=f_small)) + 60*S

# ─── Export (downscale) ────────────────────────────────────────────────────────
final = img.resize((CANVAS[0]//S, CANVAS[1]//S), Image.LANCZOS)
final.save(OUT)
print(f"OK -> {OUT} ({final.size[0]}x{final.size[1]})")
