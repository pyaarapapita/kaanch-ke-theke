"""
optimize_vinyl.py
=================
Step 1: Asset Optimization for "Kaanch Ke Theke"
Creates an optimized web-ready GLB asset (vinyl-record-opt.glb)
without overwriting the original (vinyl-record.glb).

Optimizations:
1. Resizes 2048x2048 procedural textures to 1024x1024.
2. Normal maps remain 1024x1024 PNG to guarantee lossless normal vectors and prevent compression banding in concentric sound grooves.
3. BaseColor and Roughness resized to 1024px.
4. Keeps geometry uncompressed (174 KB) to avoid heavy Draco/KTX2 WASM decoders on client runtime, ensuring instant parse time on mobile and desktop.
5. Preserves identical (0, 0, 0) centered pivot, node hierarchy, and material slots.
"""

import os
import sys
import time
import json
import numpy as np
import bpy
import bmesh

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEXTURES_OPT_DIR = os.path.join(BASE_DIR, "textures_opt")
ORIGINAL_GLB = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "public", "models", "vinyl-record.glb"))
OPTIMIZED_GLB = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "public", "models", "vinyl-record-opt.glb"))
OPT_PREVIEW_PATH = os.path.join(BASE_DIR, "preview_opt_render.png")

os.makedirs(TEXTURES_OPT_DIR, exist_ok=True)

def save_numpy_image(name, array_rgba, filepath, colorspace="sRGB"):
    h, w, c = array_rgba.shape
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    img = bpy.data.images.new(name, width=w, height=h, alpha=True, float_buffer=False)
    img.colorspace_settings.name = colorspace
    flat = array_rgba.astype(np.float32).flatten()
    img.pixels.foreach_set(flat)
    img.filepath_raw = filepath
    img.file_format = 'PNG'
    img.save()
    print(f"  [Opt-Texture] Saved {name} -> {filepath} ({w}x{h}, {colorspace})")
    return img

def generate_1024_textures():
    print("Generating optimized 1024x1024 PBR textures...")
    t0 = time.time()
    res = 1024
    u = np.linspace(-1.0, 1.0, res, dtype=np.float32)
    x, y = np.meshgrid(u, u)
    r = np.sqrt(x**2 + y**2)
    theta = np.arctan2(y, x)

    # --- Vinyl Grooves Normal & Roughness & BaseColor ---
    music_mask = ((r >= 0.38) & (r <= 0.96)).astype(np.float32)
    gaps = [
        (0.485, 0.498),
        (0.605, 0.618),
        (0.725, 0.738),
        (0.845, 0.858)
    ]
    gap_mask = np.zeros_like(r, dtype=bool)
    for g_start, g_end in gaps:
        gap_mask |= ((r >= g_start) & (r <= g_end))
    track_mask = music_mask * (~gap_mask).astype(np.float32)

    freq1 = 1200.0
    freq2 = 600.0
    groove_dr = (
        np.cos(r * freq1 * np.pi) * 0.30 +
        np.cos(r * freq2 * np.pi + np.sin(theta * 8.0) * 0.4) * 0.12
    ) * track_mask

    dead_wax_mask = ((r >= 0.22) & (r <= 0.38)).astype(np.float32)
    spiral_angle = theta + (r - 0.22) / (0.38 - 0.22) * 8.0 * np.pi
    spiral_dist = np.abs(np.mod(spiral_angle, 2.0 * np.pi) - np.pi) / np.pi
    spiral_groove = np.exp(-((1.0 - spiral_dist) * 35.0)**2) * dead_wax_mask * 0.35

    total_dr = groove_dr + spiral_groove
    nx = -total_dr * np.cos(theta)
    ny = -total_dr * np.sin(theta)
    nz = np.sqrt(np.clip(1.0 - (nx**2 + ny**2), 0.001, 1.0))

    outside_mask = (r > 1.0)
    nx[outside_mask] = 0.0
    ny[outside_mask] = 0.0
    nz[outside_mask] = 1.0

    vinyl_norm = np.stack([(nx + 1.0)*0.5, (ny + 1.0)*0.5, (nz + 1.0)*0.5, np.ones_like(nx)], axis=-1)
    
    vinyl_rough = np.full_like(r, 0.16)
    vinyl_rough[track_mask > 0] = 0.42 + 0.05 * np.sin(r[track_mask > 0] * 300.0 * np.pi)
    vinyl_rough[outside_mask] = 0.50
    vinyl_rough_img = np.stack([vinyl_rough, vinyl_rough, vinyl_rough, np.ones_like(r)], axis=-1)

    vinyl_base = np.full_like(r, 0.012)
    vinyl_base[track_mask > 0] += 0.008
    vinyl_base[gap_mask] = 0.008
    vinyl_base[outside_mask] = 0.02
    vinyl_base_img = np.stack([vinyl_base, vinyl_base, vinyl_base * 1.15, np.ones_like(r)], axis=-1)

    p_v_norm = os.path.join(TEXTURES_OPT_DIR, "vinyl_normal_opt.png")
    p_v_rough = os.path.join(TEXTURES_OPT_DIR, "vinyl_roughness_opt.png")
    p_v_base = os.path.join(TEXTURES_OPT_DIR, "vinyl_basecolor_opt.png")

    save_numpy_image("Vinyl_Normal_Opt", vinyl_norm, p_v_norm, colorspace="Non-Color")
    save_numpy_image("Vinyl_Roughness_Opt", vinyl_rough_img, p_v_rough, colorspace="Non-Color")
    save_numpy_image("Vinyl_BaseColor_Opt", vinyl_base_img, p_v_base, colorspace="sRGB")

    # --- Vintage Gold Center Label ---
    gold_hue_r = 0.78 + 0.08 * (1.0 - r * 0.5)
    gold_hue_g = 0.60 + 0.06 * (1.0 - r * 0.5)
    gold_hue_b = 0.28 + 0.04 * (1.0 - r * 0.5)

    spun_sheen = 1.0 + 0.045 * np.sin(theta * 60.0) + 0.025 * np.cos(theta * 240.0)
    micro_rings = 1.0 + 0.03 * np.sin(r * 220.0 * np.pi)

    lbl_r = gold_hue_r * spun_sheen * micro_rings
    lbl_g = gold_hue_g * spun_sheen * micro_rings
    lbl_b = gold_hue_b * spun_sheen * micro_rings

    outer_rim_mask = ((r >= 0.92) & (r <= 0.96))
    lbl_r[outer_rim_mask] = 0.96
    lbl_g[outer_rim_mask] = 0.84
    lbl_b[outer_rim_mask] = 0.52

    outer_groove = ((r >= 0.908) & (r <= 0.918)) | ((r >= 0.962) & (r <= 0.972))
    lbl_r[outer_groove] *= 0.45
    lbl_g[outer_groove] *= 0.40
    lbl_b[outer_groove] *= 0.30

    mid_ring = ((r >= 0.62) & (r <= 0.65))
    lbl_r[mid_ring] = 0.94
    lbl_g[mid_ring] = 0.80
    lbl_b[mid_ring] = 0.48

    mid_groove = ((r >= 0.612) & (r <= 0.620)) | ((r >= 0.650) & (r <= 0.658))
    lbl_r[mid_groove] *= 0.50
    lbl_g[mid_groove] *= 0.45
    lbl_b[mid_groove] *= 0.35

    accent_rings = ((r >= 0.78) & (r <= 0.79)) | ((r >= 0.46) & (r <= 0.47))
    lbl_r[accent_rings] = 0.98
    lbl_g[accent_rings] = 0.86
    lbl_b[accent_rings] = 0.55

    spindle_ring = ((r >= 0.12) & (r <= 0.16))
    lbl_r[spindle_ring] = 0.92
    lbl_g[spindle_ring] = 0.78
    lbl_b[spindle_ring] = 0.45

    hole_rim = ((r >= 0.075) & (r <= 0.085))
    lbl_r[hole_rim] *= 0.40
    lbl_g[hole_rim] *= 0.35
    lbl_b[hole_rim] *= 0.25

    lbl_r = np.clip(lbl_r, 0.0, 1.0)
    lbl_g = np.clip(lbl_g, 0.0, 1.0)
    lbl_b = np.clip(lbl_b, 0.0, 1.0)
    label_base_img = np.stack([lbl_r, lbl_g, lbl_b, np.ones_like(r)], axis=-1)

    lbl_rough = np.full_like(r, 0.34)
    lbl_rough[outer_rim_mask | mid_ring | accent_rings | spindle_ring] = 0.22
    lbl_rough[outer_groove | mid_groove | hole_rim] = 0.45
    label_rough_img = np.stack([lbl_rough, lbl_rough, lbl_rough, np.ones_like(r)], axis=-1)

    lbl_dr = np.zeros_like(r)
    lbl_dr += np.cos((r - 0.94) / 0.02 * np.pi) * 0.35 * outer_rim_mask
    lbl_dr += np.cos((r - 0.635) / 0.015 * np.pi) * 0.30 * mid_ring
    lbl_dr += np.cos((r - 0.14) / 0.02 * np.pi) * 0.25 * spindle_ring

    lnx = -lbl_dr * np.cos(theta)
    lny = -lbl_dr * np.sin(theta)
    lnz = np.sqrt(np.clip(1.0 - (lnx**2 + lny**2), 0.001, 1.0))
    label_norm_img = np.stack([(lnx + 1.0)*0.5, (lny + 1.0)*0.5, (lnz + 1.0)*0.5, np.ones_like(r)], axis=-1)

    p_l_base = os.path.join(TEXTURES_OPT_DIR, "gold_label_basecolor_opt.png")
    p_l_rough = os.path.join(TEXTURES_OPT_DIR, "gold_label_roughness_opt.png")
    p_l_norm = os.path.join(TEXTURES_OPT_DIR, "gold_label_normal_opt.png")

    save_numpy_image("Label_BaseColor_Opt", label_base_img, p_l_base, colorspace="sRGB")
    save_numpy_image("Label_Roughness_Opt", label_rough_img, p_l_rough, colorspace="Non-Color")
    save_numpy_image("Label_Normal_Opt", label_norm_img, p_l_norm, colorspace="Non-Color")

    print(f"1024x1024 textures generated in {time.time() - t0:.2f}s.")
    return {
        "v_norm": p_v_norm,
        "v_rough": p_v_rough,
        "v_base": p_v_base,
        "l_base": p_l_base,
        "l_rough": p_l_rough,
        "l_norm": p_l_norm
    }

def build_and_export_optimized(tex_paths):
    print("Building and exporting optimized GLB...")
    blend_path = os.path.join(BASE_DIR, "vinyl_record.blend")
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    mat_vinyl = bpy.data.materials.get("M_Vinyl")
    mat_label = bpy.data.materials.get("M_Vintage_Gold_Label")

    # Load replacement 1024px images
    img_v_norm = bpy.data.images.load(tex_paths["v_norm"])
    img_v_norm.colorspace_settings.name = "Non-Color"
    img_v_rough = bpy.data.images.load(tex_paths["v_rough"])
    img_v_rough.colorspace_settings.name = "Non-Color"
    img_v_base = bpy.data.images.load(tex_paths["v_base"])

    img_l_norm = bpy.data.images.load(tex_paths["l_norm"])
    img_l_norm.colorspace_settings.name = "Non-Color"
    img_l_rough = bpy.data.images.load(tex_paths["l_rough"])
    img_l_rough.colorspace_settings.name = "Non-Color"
    img_l_base = bpy.data.images.load(tex_paths["l_base"])

    # Update Vinyl material nodes by searching lowercase image names
    for node in mat_vinyl.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            name_lower = node.image.name.lower()
            if 'normal' in name_lower:
                node.image = img_v_norm
                print(f"  Updated Vinyl normal node -> {img_v_norm.name}")
            elif 'rough' in name_lower:
                node.image = img_v_rough
                print(f"  Updated Vinyl roughness node -> {img_v_rough.name}")
            elif 'base' in name_lower or 'color' in name_lower:
                node.image = img_v_base
                print(f"  Updated Vinyl basecolor node -> {img_v_base.name}")

    # Update Label material nodes
    for node in mat_label.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            name_lower = node.image.name.lower()
            if 'normal' in name_lower:
                node.image = img_l_norm
                print(f"  Updated Label normal node -> {img_l_norm.name}")
            elif 'rough' in name_lower:
                node.image = img_l_rough
                print(f"  Updated Label roughness node -> {img_l_rough.name}")
            elif 'base' in name_lower or 'color' in name_lower:
                node.image = img_l_base
                print(f"  Updated Label basecolor node -> {img_l_base.name}")

    # Reset transform of root object for export
    root_obj = bpy.data.objects.get("Vinyl_Root")
    obj_vinyl = bpy.data.objects.get("Vinyl_Body")
    obj_label = bpy.data.objects.get("Vinyl_Label")

    orig_loc = tuple(root_obj.location)
    orig_rot = tuple(root_obj.rotation_euler)

    root_obj.location = (0, 0, 0)
    root_obj.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action='DESELECT')
    root_obj.select_set(True)
    obj_vinyl.select_set(True)
    obj_label.select_set(True)
    bpy.context.view_layer.objects.active = root_obj

    # Export optimized GLB
    bpy.ops.export_scene.gltf(
        filepath=OPTIMIZED_GLB,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )

    # Restore preview transform and render verification preview
    root_obj.location = orig_loc
    root_obj.rotation_euler = orig_rot
    bpy.context.view_layer.update()

    scene = bpy.context.scene
    scene.render.filepath = OPT_PREVIEW_PATH
    scene.cycles.samples = 48
    bpy.ops.render.render(write_still=True)
    print(f"Optimized preview render saved: {OPT_PREVIEW_PATH}")

    # Return file sizes
    orig_size = os.path.getsize(ORIGINAL_GLB)
    opt_size = os.path.getsize(OPTIMIZED_GLB)
    return orig_size, opt_size

def main():
    print("=" * 60)
    print("STEP 1: ASSET OPTIMIZATION PIPELINE")
    print("=" * 60)
    tex_paths = generate_1024_textures()
    orig_size, opt_size = build_and_export_optimized(tex_paths)

    reduction_bytes = orig_size - opt_size
    reduction_pct = (reduction_bytes / orig_size) * 100.0

    print("\n" + "=" * 60)
    print("OPTIMIZATION COMPARISON RESULTS")
    print("=" * 60)
    print(f"Original GLB (2048px textures):  {ORIGINAL_GLB}")
    print(f"  File size: {orig_size:,} bytes ({orig_size / (1024*1024):.2f} MB)")
    print(f"Optimized GLB (1024px textures): {OPTIMIZED_GLB}")
    print(f"  File size: {opt_size:,} bytes ({opt_size / (1024*1024):.2f} MB)")
    print(f"File Size Reduction: {reduction_bytes:,} bytes ({reduction_bytes / (1024*1024):.2f} MB saved, -{reduction_pct:.1f}%)")
    print("=" * 60)

if __name__ == '__main__':
    main()
