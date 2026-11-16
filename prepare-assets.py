from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parent
source = root.parent / 'photo_2026-11-16_11-56-25.jpg'
image = Image.open(source)
# Normalize to the dimensions of the viewed reference before applying the crop.
image = image.resize((1205, 1600))
(root / 'assets').mkdir(exist_ok=True)
# Coordinates chosen from the viewed photograph: retain both chain and pendant.
image.crop((240, 390, 1020, 1170)).resize((1000, 1000)).save(root / 'assets/necklace.jpg', quality=94)
image.resize((904, 1200)).save(root / 'assets/necklace-full.jpg', quality=92)
print('Saved two local gift photographs; originals unchanged.')
