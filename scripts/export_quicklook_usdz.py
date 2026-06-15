import bpy
import os
from pxr import UsdUtils

FOLDER = r"C:/Users/yusuf/Desktop/rugvision/public/models"
SRC_GLB = os.path.join(FOLDER, "Modern_rug.glb")
USDA = os.path.join(FOLDER, "Modern_rug.usda")
USDZ = os.path.join(FOLDER, "Modern_rug.usdz")


def select_only(objs):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active = objs[0]


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        print("QL_ERROR: no mesh")
        return
    select_only(meshes)
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    select_only([obj])

    print("QL_DIMS:", round(obj.dimensions.x, 3),
          round(obj.dimensions.y, 3), round(obj.dimensions.z, 3))

    # ASCII .usda, converted to Y-up / -Z forward for Quick Look compatibility.
    bpy.ops.wm.usd_export(
        filepath=USDA,
        selected_objects_only=True,
        export_materials=True,
        generate_preview_surface=True,
        convert_orientation=True,
        export_global_up_selection="Y",
        export_global_forward_selection="NEGATIVE_Z",
        export_textures_mode="KEEP",
        root_prim_path="/root",
    )
    print("QL_USDA_OK")

    # Package the ASCII layer into a valid (Apple-spec) usdz.
    cwd = os.getcwd()
    os.chdir(FOLDER)
    try:
        ok = UsdUtils.CreateNewUsdzPackage("Modern_rug.usda", "Modern_rug.usdz")
        print("QL_USDZ_PACKAGED:", ok)
    finally:
        os.chdir(cwd)


main()
