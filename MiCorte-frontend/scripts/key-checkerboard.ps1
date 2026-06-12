# Convierte PNGs con patron de cuadros "horneado" en PNGs con alfa real.
# Detecta los 2 colores dominantes del tablero (muestreados en las esquinas)
# y los vuelve transparentes con falloff suave. Protege brillos calidos
# (interior de lamparas) comparando la calidez del pixel contra la del fondo.

Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class CheckerKeyer
{
    public static void Process(string inPath, string outPath)
    {
        Bitmap src = new Bitmap(inPath);
        int w = src.Width, h = src.Height;

        // ── 1. Muestrear bloques de esquina para hallar colores del tablero ──
        Dictionary<int, int> counts = new Dictionary<int, int>();
        Dictionary<int, long[]> sums = new Dictionary<int, long[]>();
        int block = Math.Min(60, Math.Min(w, h) / 4);
        int[][] corners = new int[][] {
            new int[]{0,0}, new int[]{w-block,0}, new int[]{0,h-block}, new int[]{w-block,h-block}
        };
        foreach (int[] c in corners)
        {
            for (int y = c[1]; y < c[1] + block; y++)
            for (int x = c[0]; x < c[0] + block; x++)
            {
                Color px = src.GetPixel(x, y);
                int key = ((px.R >> 3) << 10) | ((px.G >> 3) << 5) | (px.B >> 3);
                if (!counts.ContainsKey(key)) { counts[key] = 0; sums[key] = new long[3]; }
                counts[key]++;
                sums[key][0] += px.R; sums[key][1] += px.G; sums[key][2] += px.B;
            }
        }
        // top 2 buckets = los dos tonos del tablero
        int k1 = -1, k2 = -1, n1 = 0, n2 = 0;
        foreach (KeyValuePair<int,int> kv in counts)
        {
            if (kv.Value > n1) { k2 = k1; n2 = n1; k1 = kv.Key; n1 = kv.Value; }
            else if (kv.Value > n2) { k2 = kv.Key; n2 = kv.Value; }
        }
        float[] c1 = new float[] { (float)sums[k1][0]/n1, (float)sums[k1][1]/n1, (float)sums[k1][2]/n1 };
        float[] c2 = (k2 >= 0)
            ? new float[] { (float)sums[k2][0]/n2, (float)sums[k2][1]/n2, (float)sums[k2][2]/n2 }
            : c1;
        float bgWarmth = ((c1[0] - c1[2]) + (c2[0] - c2[2])) * 0.5f;

        // ── 2. Recorrer pixeles y asignar alfa por distancia al fondo ──
        Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);
        BitmapData sd = src.LockBits(new Rectangle(0,0,w,h), ImageLockMode.ReadOnly,  PixelFormat.Format24bppRgb);
        BitmapData dd = dst.LockBits(new Rectangle(0,0,w,h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        int sStride = sd.Stride, dStride = dd.Stride;
        byte[] sBuf = new byte[sStride * h];
        byte[] dBuf = new byte[dStride * h];
        Marshal.Copy(sd.Scan0, sBuf, 0, sBuf.Length);

        for (int y = 0; y < h; y++)
        {
            int sRow = y * sStride, dRow = y * dStride;
            for (int x = 0; x < w; x++)
            {
                int si = sRow + x * 3;
                byte b = sBuf[si], g = sBuf[si+1], r = sBuf[si+2];

                float d1 = Dist(r, g, b, c1);
                float d2 = Dist(r, g, b, c2);
                float d  = Math.Min(d1, d2);

                // alfa: 0 cerca del fondo, 1 lejos (banda suave 22..60)
                float a = (d - 22f) / 38f;
                if (a < 0f) a = 0f; if (a > 1f) a = 1f;

                // proteger brillos calidos (interior de lamparas):
                // mucho mas calido que el fondo y luminoso => opaco
                float lum = 0.299f*r + 0.587f*g + 0.114f*b;
                float warmth = (r - b) - bgWarmth;
                if (warmth > 22f && lum > 150f) a = 1f;

                int di = dRow + x * 4;
                dBuf[di]   = b;
                dBuf[di+1] = g;
                dBuf[di+2] = r;
                dBuf[di+3] = (byte)(a * 255f);
            }
        }

        Marshal.Copy(dBuf, 0, dd.Scan0, dBuf.Length);
        src.UnlockBits(sd);
        dst.UnlockBits(dd);
        src.Dispose();
        dst.Save(outPath, ImageFormat.Png);
        dst.Dispose();
    }

    static float Dist(byte r, byte g, byte b, float[] c)
    {
        float dr = r - c[0], dg = g - c[1], db = b - c[2];
        return (float)Math.Sqrt(dr*dr + dg*dg + db*db);
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$dir = "C:\Users\lolgr\OneDrive\Documentos\MiCorte\MiCorte\MiCorte-frontend\public\img\landing\parallax"
foreach ($name in @('sillas', 'muebles', 'lamparas')) {
    [CheckerKeyer]::Process("$dir\$name.png", "$dir\$name-alpha.png")
    Write-Output "OK: $name-alpha.png"
}
