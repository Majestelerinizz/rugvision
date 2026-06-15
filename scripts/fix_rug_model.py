import bpy
import os

SRC_GLB = r"C:\Users\yusuf\Desktop\rugvision\public\models\Modern_rug.glb"
OUT_USDZ = r"C:\Users\yusuf\Desktop\rugvision\public\models\Modern_rug_fixed.usdz"
OUT_GLB = r"C:\Users\yusuf\Desktop\rugvision\public\models\Modern_rug_fixed.glb"

TARGET_LONG = 2.30   # length (m)
TARGET_SHORT = 1.60  # width (m)
TARGET_THICK = 0.02  # thickness (m)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb():
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)


def get_meshes():
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]


def select_only(objs):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active = objs[0]


def apply_transforms(obj):
    select_only([obj])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def main():
    clear_scene()
    import_glb()

    meshes = get_meshes()
    if not meshes:
        print("RUGFIX_ERROR: no mesh imported")
        return

    select_only(meshes)
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active

    apply_transforms(obj)

    # Bring the thin axis to Z so the rug lies flat on the floor.
    d = obj.dimensions
    dims = [d.x, d.y, d.z]
    thin = dims.index(min(dims))
    if thin == 0:
        obj.rotation_euler = (0.0, 1.5707963, 0.0)
        apply_transforms(obj)
    elif thin == 1:
        obj.rotation_euler = (1.5707963, 0.0, 0.0)
        apply_transforms(obj)

    # Recompute dimensions after orientation fix.
    d = obj.dimensions
    dims = [d.x, d.y, d.z]

    # X and Y are floor axes now; Z is thickness.
    if dims[0] >= dims[1]:
        long_axis, short_axis = 0, 1
    else:
        long_axis, short_axis = 1, 0

    target = [0.0, 0.0, 0.0]
    target[long_axis] = TARGET_LONG
    target[short_axis] = TARGET_SHORT
    target[2] = TARGET_THICK

    sx = target[0] / dims[0] if dims[0] else 1.0
    sy = target[1] / dims[1] if dims[1] else 1.0
    sz = target[2] / dims[2] if dims[2] else 1.0
    obj.scale = (obj.scale.x * sx, obj.scale.y * sy, obj.scale.z * sz)
    apply_transforms(obj)

    # Origin to bounds center, then sit the rug on the floor (z = 0) centered at origin.
    select_only([obj])
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.location = (0.0, 0.0, obj.dimensions.z / 2.0)
    apply_transforms(obj)

    print("RUGFIX_DIMS:", round(obj.dimensions.x, 4),
          round(obj.dimensions.y, 4), round(obj.dimensions.z, 4))

    # Export USDZ
    select_only([obj])
    try:
        bpy.ops.wm.usd_export(
            filepath=OUT_USDZ,
            selected_objects_only=True,
            export_materials=True,
        )
        print("RUGFIX_USDZ_OK")
    except Exception as e:
        print("RUGFIX_USDZ_ERROR:", e)

    # Export GLB
    select_only([obj])
    try:
        bpy.ops.export_scene.gltf(
            filepath=OUT_GLB,
            export_format="GLB",
            use_selection=True,
        )
        print("RUGFIX_GLB_OK")
    except Exception as e:
        print("RUGFIX_GLB_ERROR:", e)


main()
