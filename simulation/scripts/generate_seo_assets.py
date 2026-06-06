from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMAGES = PUBLIC / "images"
SOURCE_FIGURE = IMAGES / "fig_perbandingan_jalur.png"

INK = "#171815"
TEXT = "#F8FAF4"
MUTED = "#B9C0B5"
LIME = "#D9FF58"
CYAN = "#16C7D9"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    font_name = "seguisb.ttf" if bold else "segoeui.ttf"
    font_path = Path("C:/Windows/Fonts") / font_name
    return ImageFont.truetype(str(font_path), size=size)


def draw_mark(size: int, maskable: bool = False) -> Image.Image:
    image = Image.new("RGBA", (size, size), INK)
    draw = ImageDraw.Draw(image)
    inset = round(size * (0.16 if maskable else 0.1))
    width = max(3, round(size * 0.085))

    points = [
        (inset, size * 0.72),
        (size * 0.31, size * 0.72),
        (size * 0.38, size * 0.43),
        (size * 0.53, size * 0.43),
        (size * 0.61, size * 0.27),
        (size - inset, size * 0.27),
    ]
    draw.line(points, fill=LIME, width=width, joint="curve")

    radius = round(size * 0.095)
    start = (inset, round(size * 0.72))
    draw.ellipse(
        (
            start[0] - radius,
            start[1] - radius,
            start[0] + radius,
            start[1] + radius,
        ),
        fill=CYAN,
        outline=TEXT,
        width=max(2, round(size * 0.025)),
    )

    arrow = size - inset
    draw.line(
        (
            size * 0.72,
            size * 0.18,
            arrow,
            size * 0.18,
            arrow,
            size * 0.4,
        ),
        fill=TEXT,
        width=max(3, round(size * 0.055)),
        joint="curve",
    )
    draw.line(
        (size * 0.72, size * 0.4, arrow, size * 0.18),
        fill=TEXT,
        width=max(3, round(size * 0.055)),
    )
    return image


def cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    ratio = max(target_w / image.width, target_h / image.height)
    resized = image.resize(
        (round(image.width * ratio), round(image.height * ratio)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def create_social_preview() -> None:
    source = Image.open(SOURCE_FIGURE).convert("RGB")
    background = cover_crop(source, (1200, 630))
    background = ImageEnhance.Color(background).enhance(0.78)
    background = ImageEnhance.Contrast(background).enhance(1.12)
    background = background.filter(ImageFilter.GaussianBlur(radius=1.4))

    overlay = Image.new("RGBA", background.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for x in range(1200):
        alpha = round(224 - 94 * (x / 1199))
        overlay_draw.line((x, 0, x, 630), fill=(10, 12, 9, alpha))
    overlay_draw.rectangle((0, 0, 1200, 630), outline=(217, 255, 88, 96), width=3)

    canvas = Image.alpha_composite(background.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((64, 58, 348, 100), radius=4, fill=LIME)
    draw.text(
        (82, 66),
        "MAKALAH INTERAKTIF ASA 2026",
        fill=INK,
        font=font(21, bold=True),
    )

    draw.text((64, 154), "ROBOT PATH", fill=TEXT, font=font(64, bold=True))
    draw.text((64, 224), "PLANNING", fill=TEXT, font=font(64, bold=True))
    draw.text((64, 319), "Brute Force  /  UCS  /  GBFS  /  A*  /  RRT*", fill=LIME, font=font(27, bold=True))

    subtitle = "Analisis kualitas jalur, waktu, keberhasilan, dan processed\npada lapangan robot humanoid berhalangan."
    draw.multiline_text(
        (66, 382),
        subtitle,
        fill=MUTED,
        font=font(25),
        spacing=10,
    )

    draw.line((66, 527, 1134, 527), fill=(248, 250, 244, 92), width=2)
    draw.text(
        (66, 552),
        "Muchammad Yuda Tri Ananda  ·  Informatika Universitas Diponegoro",
        fill=TEXT,
        font=font(21, bold=True),
    )
    canvas.convert("RGB").save(IMAGES / "social-preview.png", quality=92, optimize=True)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)

    icon_192 = draw_mark(192)
    icon_512 = draw_mark(512)
    icon_maskable = draw_mark(512, maskable=True)
    apple = draw_mark(180)

    icon_192.save(PUBLIC / "icon-192.png", optimize=True)
    icon_512.save(PUBLIC / "icon-512.png", optimize=True)
    icon_maskable.save(PUBLIC / "icon-512-maskable.png", optimize=True)
    apple.save(PUBLIC / "apple-touch-icon.png", optimize=True)

    ico_source = draw_mark(256).convert("RGBA")
    ico_source.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    create_social_preview()


if __name__ == "__main__":
    main()
