"""
Fotoğraf + en/boy (cm) -> gerçek ölçekli GLB + iPhone uyumlu USDZ.

Kullanim (Blender kurulu olmali):
  blender --background --python scripts/generate_rug_model.py -- ^
    --image path/to/rug.jpg ^
    --width-cm 160 ^
    --length-cm 230 ^
    --slug RV-LUNA-001 ^
    --out-dir public/models

Cikti:
  public/models/RV-LUNA-001.glb
  public/models/RV-LUNA-001.usdz
"""

import argparse
import os
import sys

import bpy

try:
    from pxr import UsdUtils
except ImportError:
    UsdUtils = None

DEFAULT_THICKNESS_M = 0.02


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Generate rug GLB/USDZ from photo")
    parser.add_argument("--image", required=True, help="Ustten urun fotografi (jpg/png)")
    parser.add_argument("--width-cm", type=float, required=True)
    parser.add_argument("--length-cm", type=float, required=True)
    parser.add_argument("--slug", required=True, help="Dosya adi tabani (orn. RV-LUNA-001)")
    parser.add_argument("--out-dir", default="public/models")
    parser.add_argument("--thickness-cm", type=float, default=2.0)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


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


def create_rug_object(length_m: float, width_m: float, thickness_m: float):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0.0, 0.0, 0.0))
    obj = bpy.context.active_object
    obj.name = "Rug"

    # Blender surumlerinde plane boyutu farkli olabilir; hedef metre olculerine kilitle.
    dims = obj.dimensions
    sx = length_m / dims.x if dims.x else 1.0
    sy = width_m / dims.y if dims.y else 1.0
    obj.scale = (obj.scale.x * sx, obj.scale.y * sy, obj.scale.z)
    apply_transforms(obj)

    solid = obj.modifiers.new(name="Solidify", type="SOLIDIFY")
    solid.thickness = thickness_m
    solid.offset = -1.0
    select_only([obj])
    bpy.ops.object.modifier_apply(modifier=solid.name)

    select_only([obj])
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.location = (0.0, 0.0, thickness_m / 2.0)
    apply_transforms(obj)

    return obj


def apply_image_material(obj, image_path: str):
    image_path = os.path.abspath(image_path)
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Gorsel bulunamadi: {image_path}")

    img = bpy.data.images.load(image_path)
    mat = bpy.data.materials.new(name="RugMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    tex = nodes.new(type="ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Linear"

    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    select_only([obj])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def export_glb(obj, out_path: str):
    select_only([obj])
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


def export_usdz(obj, folder: str, base: str):
    if UsdUtils is None:
        print("RUGGEN_USDZ_SKIP: pxr.UsdUtils yok (Blender USD eklentisi)")
        return False

    usda = os.path.join(folder, f"{base}.usda")
    usdz = os.path.join(folder, f"{base}.usdz")

    select_only([obj])
    bpy.ops.wm.usd_export(
        filepath=usda,
        selected_objects_only=True,
        export_materials=True,
        generate_preview_surface=True,
        convert_orientation=True,
        export_global_up_selection="Y",
        export_global_forward_selection="NEGATIVE_Z",
        export_textures_mode="KEEP",
        root_prim_path="/root",
    )

    cwd = os.getcwd()
    os.chdir(folder)
    try:
        ok = UsdUtils.CreateNewUsdzPackage(f"{base}.usda", f"{base}.usdz")
        print("RUGGEN_USDZ_PACKAGED:", ok, usdz)
        return bool(ok)
    finally:
        os.chdir(cwd)


def main():
    args = parse_args()
    width_m = args.width_cm / 100.0
    length_m = args.length_cm / 100.0
    thickness_m = args.thickness_cm / 100.0

    out_dir = os.path.abspath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)
    slug = args.slug.strip().replace(" ", "-")
    glb_path = os.path.join(out_dir, f"{slug}.glb")

    clear_scene()
    obj = create_rug_object(length_m, width_m, thickness_m)
    apply_image_material(obj, args.image)

    dims = obj.dimensions
    print(
        "RUGGEN_DIMS:",
        round(dims.x, 4),
        round(dims.y, 4),
        round(dims.z, 4),
        "m",
    )

    export_glb(obj, glb_path)
    print("RUGGEN_GLB_OK:", glb_path)

    export_usdz(obj, out_dir, slug)
    print("RUGGEN_DONE:", slug)


if __name__ == "__main__":
    main()
