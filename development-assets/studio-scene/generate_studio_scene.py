"""
generate_studio_scene.py
========================
P2 assets for Kaanch Ke Theke: the back room behind the theka counter, and five mix-tapes.

Outputs (written by Blender in background mode):
  public/models/studio-room.glb   room geometry with all lighting baked into one texture
  public/models/cassettes.glb     five cassettes, one per playlist mood, lit in real time
  development-assets/studio-scene/studio_scene.blend   editable source
  development-assets/studio-scene/preview_room.png     Cycles preview from the hero camera

Run from the project root:
  node development-assets/studio-scene/make_cassette_labels.mjs
  "D:\\Program Files\\blender.exe" -b --factory-startup --python development-assets/studio-scene/generate_studio_scene.py

Scale: the vinyl in the site is 3 units wide (a 30 cm record), so 1 unit = 10 cm.
The room sits behind the record's world position and never in front of the camera path.
Its lighting is baked: the site draws it with an unlit material, so deep shadows and lamp
glow cost nothing at runtime.
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ASSETS = os.path.join(ROOT, "development-assets", "studio-scene")
TEXTURES = os.path.join(ASSETS, "textures")
MODELS = os.path.join(ROOT, "public", "models")
ATLAS_PATH = os.path.join(TEXTURES, "cassette_atlas.png")

BAKE_SIZE = 2048
EXPORT_SIZE = 1024
BAKE_SAMPLES = int(os.environ.get("BAKE_SAMPLES", "192"))
SEED = 1990

# 1 unit = 10 cm. A C-90 cassette is 100 x 63 x 12 mm.
CASSETTE = (1.0, 0.63, 0.12)
TAPE_COUNT = 5


# --------------------------------------------------------------------------- helpers

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = BAKE_SAMPLES
    scene.cycles.use_denoising = True
    scene.unit_settings.system = "METRIC"
    try_gpu(scene)
    return scene


def try_gpu(scene):
    """Bakes on the GPU when one is available, otherwise stays on the CPU."""
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for backend in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
            try:
                prefs.compute_device_type = backend
                prefs.get_devices()
                if any(d.type == backend for d in prefs.devices):
                    for device in prefs.devices:
                        device.use = device.type == backend
                    scene.cycles.device = "GPU"
                    print(f"[scene] Cycles device: GPU ({backend})")
                    return
            except TypeError:
                continue
    except Exception as error:  # noqa: BLE001 - any failure means CPU
        print(f"[scene] GPU unavailable ({error}); using CPU")
    scene.cycles.device = "CPU"
    print("[scene] Cycles device: CPU")


def material(name, color, roughness=0.8, metallic=0.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def srgb(hex_code):
    """Hex colour to linear RGB, the space Blender's colour inputs expect."""
    hex_code = hex_code.lstrip("#")
    values = [int(hex_code[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values)


def to_blender(v):
    """Scene layout is written in the site's Y-up coordinates. Blender is Z-up, and the
    glTF exporter converts back, so (x, y, z) here becomes (x, -z, y) in Blender."""
    x, y, z = v
    return (x, -z, y)


def box(name, size, location, mat, bevel=0.0):
    sx, sy, sz = size
    bpy.ops.mesh.primitive_cube_add(size=1, location=to_blender(location))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sz, sy)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    return obj


def lathe(name, profile, location, mat, segments=10):
    """Revolves a (radius, height) profile around the up axis. Bottles, jars, the bulb."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for radius, height in profile:
        ring = []
        for s in range(segments):
            a = 2 * math.pi * s / segments
            ring.append(bm.verts.new((math.cos(a) * radius, math.sin(a) * radius, height)))
        rings.append(ring)
    for r in range(len(rings) - 1):
        for s in range(segments):
            n = (s + 1) % segments
            bm.faces.new((rings[r][s], rings[r][n], rings[r + 1][n], rings[r + 1][s]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = to_blender(location)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


# --------------------------------------------------------------------------- the room

def build_room():
    rng = random.Random(SEED)
    wood_dark = material("wall_wood", srgb("#2b1d14"), 0.85)
    wood_mid = material("shelf_wood", srgb("#4a3020"), 0.75)
    counter_wood = material("counter_wood", srgb("#3a2416"), 0.6)
    counter_top = material("counter_top", srgb("#5a3a22"), 0.45)
    sign_red = material("sign_red", srgb("#7c2d24"), 0.7)
    brass = material("brass", srgb("#b8894a"), 0.35, 1.0)
    glass = [
        material("glass_amber", srgb("#5a2c0e"), 0.25),
        material("glass_green", srgb("#1c3322"), 0.25),
        material("glass_clear", srgb("#5c5648"), 0.2),
        material("glass_dark", srgb("#2a1a10"), 0.3),
        material("label_paper", srgb("#d8c69c"), 0.8),
    ]
    bulb_glow = material("bulb", srgb("#ffb066"), 0.4, emission=srgb("#ffb066"), strength=60.0)
    flame = material("lantern_flame", srgb("#ff9a3c"), 0.5, emission=srgb("#ff9a3c"), strength=25.0)
    objects = []

    # Back wall of vertical planks, slightly uneven, 40 units behind the record.
    plank_w = 0.9
    # Wide enough that its edges fall into darkness instead of reading as a board.
    for i in range(-34, 35):
        depth = rng.uniform(0.0, 0.06)
        objects.append(box(f"plank_{i}", (plank_w * 0.97, 22, 0.25), (i * plank_w, 1.0, -40 - depth), wood_dark))

    # Three shelves of bottles behind the counter.
    shelf_heights = [-1.5, 2.6, 6.7]
    for row, y in enumerate(shelf_heights):
        objects.append(box(f"shelf_{row}", (34, 0.35, 3.2), (0, y, -38.2), wood_mid, bevel=0.05))
        x = -16.5
        while x < 16.5:
            kind = rng.random()
            scale = rng.uniform(0.85, 1.25)
            if kind < 0.7:
                r = 0.55 * scale
                h = rng.uniform(2.6, 3.6) * scale
                profile = [(r, 0), (r, h * 0.62), (r * 0.42, h * 0.78), (r * 0.25, h * 0.86), (r * 0.25, h), (r * 0.3, h * 1.02), (0.0, h * 1.02)]
                width = r * 2
            else:
                r = 0.7 * scale
                h = rng.uniform(1.4, 2.0) * scale
                profile = [(r * 0.9, 0), (r, h * 0.15), (r, h * 0.85), (r * 0.8, h), (0.0, h)]
                width = r * 2
            mat = glass[rng.randrange(4)]
            # bottle.location is in Blender axes: the site's z is -location.y.
            bottle = lathe(f"bottle_{row}_{x:.1f}", profile, (x + width / 2, y + 0.18, -38.4 + rng.uniform(-0.6, 0.6)), mat, 8)
            objects.append(bottle)
            if rng.random() < 0.55:
                objects.append(box(f"label_{row}_{x:.1f}", (width * 0.8, h * 0.22, 0.04), (x + width / 2, y + 0.18 + h * 0.32, -bottle.location.y + r + 0.02), glass[4]))
            x += width + rng.uniform(0.12, 0.5)

    # The counter, between the record and the shelves.
    objects.append(box("counter_body", (36, 7.5, 3.2), (0, -14.5, -24), counter_wood, bevel=0.08))
    objects.append(box("counter_top", (37, 0.5, 4.0), (0, -10.6, -24), counter_top, bevel=0.1))
    objects.append(box("counter_sign", (7.5, 2.0, 0.1), (-9.0, -13.4, -22.35), sign_red, bevel=0.03))

    # Hanging bulb with a brass shade, warm and slightly off-centre, above the record's side.
    objects.append(lathe("bulb", [(0.0, -0.55), (0.35, -0.45), (0.45, -0.1), (0.3, 0.25), (0.15, 0.35), (0.0, 0.36)], (9.0, 11.2, -26), bulb_glow, 12))
    objects.append(lathe("shade", [(2.0, 0.0), (1.6, 0.4), (0.5, 1.4), (0.2, 1.6), (0.0, 1.6)], (9.0, 11.25, -26), brass, 16))
    objects.append(box("cord", (0.06, 14, 0.06), (9.0, 19.2, -26), wood_dark))

    # Kerosene lantern on the counter, echoing the one in the bar photo and the page.
    objects.append(lathe("lantern_glass", [(0.0, 0.0), (0.7, 0.1), (0.8, 1.2), (0.55, 1.9), (0.0, 1.95)], (-12.5, -10.35, -24.4), glass[2], 12))
    objects.append(lathe("lantern_flame", [(0.0, 0.0), (0.18, 0.3), (0.1, 0.8), (0.0, 0.95)], (-12.5, -9.8, -24.4), flame, 8))
    objects.append(lathe("lantern_cap", [(0.9, 0.0), (0.6, 0.5), (0.15, 0.7), (0.0, 0.7)], (-12.5, -8.4, -24.4), brass, 12))

    # Light sources for the bake. The page's own lights are added again at runtime for the disc.
    bpy.ops.object.light_add(type="POINT", location=to_blender((9.0, 10.4, -26)))
    bulb = bpy.context.active_object
    # Cycles reads units as metres, so these energies are large for a room 4 m (40 units) deep.
    bulb.data.energy = 70000
    bulb.data.color = srgb("#ffc896")
    bulb.data.shadow_soft_size = 0.4
    bpy.ops.object.light_add(type="POINT", location=to_blender((-12.5, -9.3, -24.0)))
    lantern = bpy.context.active_object
    lantern.data.energy = 26000
    lantern.data.color = srgb("#ff8c33")
    lantern.data.shadow_soft_size = 0.3

    # A broad, dim warm fill so the shelves read as silhouettes rather than pure black.
    bpy.ops.object.light_add(type="AREA", location=to_blender((-2.0, 6.0, -12.0)))
    fill = bpy.context.active_object
    fill.data.energy = 9000
    fill.data.size = 24
    fill.data.color = srgb("#c98a52")
    # An area light faces Blender's -Z; tip it towards the wall (+Y in Blender) and down.
    fill.rotation_euler = (math.radians(60), 0, 0)

    world = bpy.data.worlds.new("room_world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (*srgb("#0b0807"), 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25
    bpy.context.scene.world = world
    return objects


def bake_room(objects):
    """Joins the room, unwraps it once, and bakes diffuse light and emission into one image."""
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    room = bpy.context.active_object
    room.name = "Studio_Room"

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")

    image = bpy.data.images.new("room_baked", BAKE_SIZE, BAKE_SIZE, alpha=False, float_buffer=True)
    for mat in room.data.materials:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        mat.node_tree.nodes.active = node

    scene = bpy.context.scene
    scene.render.bake.margin = 6
    print(f"[bake] {len(room.data.polygons)} faces, {BAKE_SIZE}px, {BAKE_SAMPLES} samples")
    bpy.ops.object.bake(type="COMBINED", pass_filter={"EMIT", "DIRECT", "INDIRECT", "DIFFUSE"})

    image.filepath_raw = os.path.join(TEXTURES, "room_baked.png")
    image.file_format = "PNG"
    image.save()

    # Baked at 2048 for clean light, shipped at 1024: the room is a dim background.
    shipped = bpy.data.images.load(image.filepath_raw)
    shipped.scale(EXPORT_SIZE, EXPORT_SIZE)

    # One flat material: the site replaces it with an unlit material using this texture.
    baked = bpy.data.materials.new("M_Room_Baked")
    baked.use_nodes = True
    tex = baked.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = shipped
    bsdf = baked.node_tree.nodes["Principled BSDF"]
    baked.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    room.data.materials.clear()
    room.data.materials.append(baked)
    return room


# --------------------------------------------------------------------------- cassettes

def build_cassettes():
    atlas = bpy.data.images.load(ATLAS_PATH)
    # 512 x 322 per face is plenty for a cassette that is at most a few hundred pixels wide.
    atlas.scale(atlas.size[0] // 2, atlas.size[1] // 2)
    mats = []
    for name, rough in (("M_Cassette", 0.42),):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = atlas
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = rough
        mats.append(mat)

    w, h, d = CASSETTE
    tapes = []
    for i in range(TAPE_COUNT):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
        obj = bpy.context.active_object
        obj.name = f"Cassette_{i}"
        obj.scale = (w, h, d)
        bpy.ops.object.transform_apply(scale=True)
        bevel = obj.modifiers.new("bevel", "BEVEL")
        bevel.width = 0.025
        bevel.segments = 2
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        obj.data.materials.append(mats[0])

        # UVs: front face to the left cell of row i, back face (mirrored) to the right cell,
        # edges to a strip of plain shell colour inside the same row.
        cell_v_top = 1 - i / TAPE_COUNT
        cell_h = 1 / TAPE_COUNT
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        uv = bm.loops.layers.uv.new("UVMap")
        for face in bm.faces:
            n = face.normal
            for loop in face.loops:
                x, y, _ = loop.vert.co
                u = (x + w / 2) / w
                v = (y + h / 2) / h
                if n.z > 0.7:
                    loop[uv].uv = (u * 0.5, cell_v_top - cell_h + v * cell_h)
                elif n.z < -0.7:
                    loop[uv].uv = (0.5 + (1 - u) * 0.5, cell_v_top - cell_h + v * cell_h)
                else:
                    loop[uv].uv = (0.004 + u * 0.004, cell_v_top - cell_h * 0.5 + (v - 0.5) * cell_h * 0.02)
        bm.to_mesh(obj.data)
        bm.free()
        obj.location = (i * 1.4, 0, 0)
        tapes.append(obj)
    return tapes


# --------------------------------------------------------------------------- export

def export(objects, path, image_quality, normals=True):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    options = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_normals=normals,
        export_texcoords=True,
        export_lights=False,
        export_cameras=False,
    )
    if "export_image_format" in options:
        kwargs["export_image_format"] = "WEBP"
    if "export_image_quality" in options:
        kwargs["export_image_quality"] = image_quality
    if "export_image_webp_fallback" in options:
        kwargs["export_image_webp_fallback"] = False
    bpy.ops.export_scene.gltf(**kwargs)
    print(f"[export] {path} {os.path.getsize(path)} bytes")


def preview(room):
    """A quick Cycles still from the hero camera, for checking the bake by eye."""
    scene = bpy.context.scene
    bpy.ops.object.camera_add(location=to_blender((0, 1.8, 4.4)))
    cam = bpy.context.active_object
    cam.data.lens_unit = "FOV"
    cam.data.sensor_fit = "VERTICAL"
    cam.data.angle = math.radians(42)
    cam.data.clip_end = 200
    direction = Vector(to_blender((0, -2, -30))) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.cycles.samples = 64
    # Match the site, which shows the bake through a plain sRGB texture.
    scene.view_settings.view_transform = "Standard"
    scene.render.filepath = os.path.join(ASSETS, "preview_room.png")
    bpy.ops.render.render(write_still=True)


def main():
    if not os.path.exists(ATLAS_PATH):
        sys.exit("Run make_cassette_labels.mjs first: cassette_atlas.png is missing")
    os.makedirs(MODELS, exist_ok=True)

    reset_scene()
    room = bake_room(build_room())
    tapes = build_cassettes()
    for tape in tapes:
        tape.hide_render = True
    preview(room)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ASSETS, "studio_scene.blend"))

    # The site draws the room unlit, so it needs no normals: about a third less data.
    export([room], os.path.join(MODELS, "studio-room.glb"), 82, normals=False)
    export(tapes, os.path.join(MODELS, "cassettes.glb"), 88)
    print("[done]")


main()
