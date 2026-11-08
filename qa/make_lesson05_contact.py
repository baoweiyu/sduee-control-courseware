from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent / "lesson05-20261108-shots"
font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 22)
for start in (1, 21, 41):
    sheet = Image.new("RGB", (1600, 1250), "#D8DEE8")
    draw = ImageDraw.Draw(sheet)
    for pos, number in enumerate(range(start, min(start + 20, 61))):
        image = Image.open(root / f"{number:02d}-final.png").convert("RGB")
        image.thumbnail((390, 220), Image.Resampling.LANCZOS)
        x, y = (pos % 4) * 400, (pos // 4) * 250
        sheet.paste(image, (x + 5, y + 27))
        draw.text((x + 8, y + 2), f"P{number}", fill="#16324F", font=font)
    sheet.save(root / f"contact-{start:02d}-{min(start+19,60):02d}.png")
