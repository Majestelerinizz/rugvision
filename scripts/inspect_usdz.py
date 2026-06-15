from pxr import Usd, UsdGeom

P = r"C:/Users/yusuf/Desktop/rugvision/public/models/Modern_rug.usdz"
stage = Usd.Stage.Open(P)
print("INSP_UP_AXIS:", UsdGeom.GetStageUpAxis(stage))
print("INSP_MPU:", UsdGeom.GetStageMetersPerUnit(stage))
for p in stage.Traverse():
    print("INSP_PRIM:", p.GetPath(), "|", p.GetTypeName())
    for a in p.GetAttributes():
        n = a.GetName()
        if "file" in n.lower() or "asset" in n.lower():
            print("INSP_ASSET:", n, "=", a.Get())
