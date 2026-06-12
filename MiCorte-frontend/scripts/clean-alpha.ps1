# Pone en negro los pixeles totalmente transparentes para mejorar la compresion PNG.
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class AlphaCleaner
{
    public static void Process(string path)
    {
        Bitmap src = new Bitmap(path);
        int w = src.Width, h = src.Height;
        BitmapData bd = src.LockBits(new Rectangle(0,0,w,h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        byte[] buf = new byte[bd.Stride * h];
        Marshal.Copy(bd.Scan0, buf, 0, buf.Length);
        for (int i = 0; i < buf.Length; i += 4)
        {
            if (buf[i+3] == 0) { buf[i] = 0; buf[i+1] = 0; buf[i+2] = 0; }
        }
        Marshal.Copy(buf, 0, bd.Scan0, buf.Length);
        src.UnlockBits(bd);
        string tmp = path + ".tmp.png";
        src.Save(tmp, ImageFormat.Png);
        src.Dispose();
        System.IO.File.Delete(path);
        System.IO.File.Move(tmp, path);
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$dir = "C:\Users\lolgr\OneDrive\Documentos\MiCorte\MiCorte\MiCorte-frontend\public\img\landing\parallax"
foreach ($f in @('sillas-alpha.png', 'muebles-alpha.png', 'lamparas-alpha.png')) {
    [AlphaCleaner]::Process("$dir\$f")
    Write-Output "OK: $f"
}
