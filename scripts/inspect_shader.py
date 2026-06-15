import bpy
from pxr import Usd, UsdShade

P = r"C:/Users/yusuf/Desktop/rugvision/public/models/Modern_rug.usdz"
stage = Usd.Stage.Open(P)
for p in stage.Traverse():
    if p.GetTypeName() == "Shader":
        sh = UsdShade.Shader(p)
        print("SHADER_ID:", p.GetPath(), "->", sh.GetIdAttr().Get())

print("---- usd_export props ----")
props = bpy.ops.wm.usd_export.get_rna_type().properties
for pr in props:
    if pr.identifier in ("rna_type",):
        continue
    print("PROP:", pr.identifier)
