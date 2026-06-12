# Quita el fondo blanco de las capas de parallax (PNG RGB -> RGBA).
# Usa flood-fill desde los bordes para no perforar blancos internos
# (ej. el interior brillante de las lamparas), y des-matiza los bordes
# para eliminar el halo blanco del antialiasing.
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

THRESH = 235          # canal minimo para considerarse "casi blanco"
FEATHER_PX = 1.2      # suavizado del borde del alfa


def remove_white_bg(src, dst):
    img = Image.open(src).convert('RGB')
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]

    near_white = a.min(axis=2) >= THRESH

    # Flood-fill BFS desde todos los pixeles del borde que sean casi blancos
    bg = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))

    # Alfa: 0 en fondo, 255 en sujeto; erosion de 1px para comerse el
    # halo blanco del antialiasing + feather para bordes suaves
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha_img = (
        Image.fromarray(alpha, 'L')
        .filter(ImageFilter.MinFilter(3))
        .filter(ImageFilter.GaussianBlur(FEATHER_PX))
    )
    af = np.asarray(alpha_img).astype(np.float32) / 255.0

    # Des-matizar del blanco: c_orig = (c_obs - (1-a)*255) / a
    af3 = af[..., None]
    unmatted = np.where(
        af3 > 0.01,
        np.clip((a - (1.0 - af3) * 255.0) / np.maximum(af3, 0.01), 0, 255),
        0,
    )

    out = np.dstack([unmatted.astype(np.uint8), (af * 255).astype(np.uint8)])
    Image.fromarray(out, 'RGBA').save(dst, optimize=True)
    print(f'{dst}: ok ({w}x{h})')


if __name__ == '__main__':
    for i in range(1, len(sys.argv), 2):
        remove_white_bg(sys.argv[i], sys.argv[i + 1])
