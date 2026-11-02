Add-Type -AssemblyName System.Drawing
$assemblyRoot = Split-Path ([System.Drawing.Bitmap].Assembly.Location)
$references = @('System.Drawing.Common.dll','System.Drawing.Primitives.dll','System.Private.Windows.GdiPlus.dll','System.Private.Windows.Core.dll','System.Runtime.dll','System.Runtime.InteropServices.dll') | ForEach-Object { Join-Path $assemblyRoot $_ }
Add-Type -ReferencedAssemblies $references @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class PrintArt {
  public static void Cut(string source, string output, Rectangle area) {
    using (var original = new Bitmap(source))
    using (var result = new Bitmap(area.Width, area.Height, PixelFormat.Format32bppArgb)) {
      using (var g = Graphics.FromImage(result)) g.DrawImage(original, new Rectangle(0,0,area.Width,area.Height), area, GraphicsUnit.Pixel);
      var rect = new Rectangle(0,0,result.Width,result.Height);
      var data = result.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      var bytes = new byte[Math.Abs(data.Stride)*data.Height];
      Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
      for (int y=0; y<data.Height; y++) for (int x=0; x<data.Width; x++) {
        int i=y*data.Stride+x*4;
        int min=Math.Min(bytes[i],Math.Min(bytes[i+1],bytes[i+2]));
        if (min>=252) bytes[i+3]=0;
        else if (min>235) bytes[i+3]=(byte)((252-min)*255/17);
      }
      Marshal.Copy(bytes,0,data.Scan0,bytes.Length);
      result.UnlockBits(data);
      result.Save(output, ImageFormat.Png);
    }
  }
}
'@
$root = Resolve-Path (Join-Path $PSScriptRoot '..\assets\packaging')
[PrintArt]::Cut((Join-Path $root 'box-dieline.png'),(Join-Path $root 'box-dieline-single.png'),[System.Drawing.Rectangle]::new(12,24,770,1085))
[PrintArt]::Cut((Join-Path $root 'label-sheet.png'),(Join-Path $root 'name-tag-single.png'),[System.Drawing.Rectangle]::new(90,90,225,70))
[PrintArt]::Cut((Join-Path $root 'label-sheet.png'),(Join-Path $root 'logo-sticker-single.png'),[System.Drawing.Rectangle]::new(56,1263,295,295))
