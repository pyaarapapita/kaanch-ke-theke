"""
generate_vinyl.py
=================
Cinematic 3D Vinyl Record Asset Generator for "Kaanch Ke Theke"
Inspired by 1990s Bollywood & nostalgic golden era Hindi music.

Features:
- Procedurally generated 2048x2048 high-fidelity PBR textures:
  * Tangent space normal map with physical concentric sound grooves (5 track bands, 4 quiet gaps, spiral run-out groove).
  * Roughness map with anisotropic micro-scattering across grooves and mirror-like gloss on dead wax and gaps.
  * Deep pitch vinyl black base color.
  * Authentic vintage gold center label with spun-metal radial sheen, concentric guilloche framing rings,
    and text-free center designed for website typography.
- Clean manifold 3D geometry with beveled 180g audiophile outer rim and central spindle hole.
- Animation-ready hierarchy with centered (0,0,0) rotation pivot.
- Web-compatible GLB export with embedded glTF 2.0 PBR materials for React Three Fiber & GSAP ScrollTrigger.
- Editable .blend source file and cinematic Cycles studio preview render.
"""

import bpy
import bmesh
import os
import sys
import time
import json
import numpy as np

# ---------------------------------------------------------------------------
# Configuration & Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEXTURES_DIR = os.path.join(BASE_DIR, "textures")
BLEND_FILEPATH = os.path.join(BASE_DIR, "vinyl_record.blend")
PREVIEW_FILEPATH = os.path.join(BASE_DIR, "preview_render.png")

# Public model directory for web application
PUBLIC_MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "public", "models"))
GLB_FILEPATH = os.path.join(PUBLIC_MODELS_DIR, "vinyl-record.glb")

os.makedirs(TEXTURES_DIR, exist_ok=True)
os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Helper: Save image from NumPy array
# ---------------------------------------------------------------------------
def save_numpy_image(name, array_rgba, filepath, colorspace="sRGB"):
    """
    Saves a float32 RGBA numpy array of shape (H, W, 4) into a Blender image and writes PNG.
    """
    h, w, c = array_rgba.shape
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    img = bpy.data.images.new(name, width=w, height=h, alpha=True, float_buffer=False)
    img.colorspace_settings.name = colorspace
    
    # Flatten array for foreach_set
    flat = array_rgba.astype(np.float32).flatten()
    img.pixels.foreach_set(flat)
    
    img.filepath_raw = filepath
    img.file_format = 'PNG'
    img.save()
    print(f"  [Texture] Saved {name} -> {filepath} ({w}x{h}, {colorspace})")
    return img

# ---------------------------------------------------------------------------
# 1. Procedural Texture Generation
# ---------------------------------------------------------------------------
def generate_textures(res=2048):
    print(f"Generating procedural textures ({res}x{res})...")
    t0 = time.time()
    
    u = np.linspace(-1.0, 1.0, res, dtype=np.float32)
    x, y = np.meshgrid(u, u)
    r = np.sqrt(x**2 + y**2)
    theta = np.arctan2(y, x)
    
    # --- A. VINYL GROOVES NORMAL & ROUGHNESS & BASECOLOR ---
    # Radius r in [0, 1] relative to outer record edge
    # Outer disc is r <= 1.0
    # Music zone is r in [0.38, 0.96]
    music_mask = ((r >= 0.38) & (r <= 0.96)).astype(np.float32)
    
    # 4 silent track gaps dividing the 5 songs
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
    
    # Concentric micro-groove slope:
    # High frequency wave modulation to create realistic optical diffraction
    freq1 = 1400.0
    freq2 = 700.0
    groove_dr = (
        np.cos(r * freq1 * np.pi) * 0.30 +
        np.cos(r * freq2 * np.pi + np.sin(theta * 8.0) * 0.4) * 0.12
    ) * track_mask
    
    # Spiral run-out groove in dead wax (r in [0.22, 0.38])
    dead_wax_mask = ((r >= 0.22) & (r <= 0.38)).astype(np.float32)
    spiral_angle = theta + (r - 0.22) / (0.38 - 0.22) * 8.0 * np.pi
    spiral_dist = np.abs(np.mod(spiral_angle, 2.0 * np.pi) - np.pi) / np.pi
    spiral_groove = np.exp(-((1.0 - spiral_dist) * 35.0)**2) * dead_wax_mask * 0.35
    
    total_dr = groove_dr + spiral_groove
    
    # Tangent-space Normal calculation
    nx = -total_dr * np.cos(theta)
    ny = -total_dr * np.sin(theta)
    nz = np.sqrt(np.clip(1.0 - (nx**2 + ny**2), 0.001, 1.0))
    
    # Outside record rim (r > 1.0) normal is flat (0, 0, 1)
    outside_mask = (r > 1.0)
    nx[outside_mask] = 0.0
    ny[outside_mask] = 0.0
    nz[outside_mask] = 1.0
    
    vinyl_norm_img = np.stack([
        (nx + 1.0) * 0.5,
        (ny + 1.0) * 0.5,
        (nz + 1.0) * 0.5,
        np.ones_like(nx)
    ], axis=-1)
    
    # Roughness for vinyl:
    # Sound grooves: ~0.42 (anisotropic scattering)
    # Gaps & dead wax: ~0.15 (mirror gloss)
    # Lead-in outer rim (r in [0.96, 1.0]): ~0.16
    vinyl_rough = np.full_like(r, 0.16)
    vinyl_rough[track_mask > 0] = 0.42 + 0.05 * np.sin(r[track_mask > 0] * 300.0 * np.pi)
    vinyl_rough[outside_mask] = 0.50
    vinyl_rough_img = np.stack([vinyl_rough, vinyl_rough, vinyl_rough, np.ones_like(r)], axis=-1)
    
    # Base Color for vinyl:
    # Deep pitch black carbon PVC (#0d0d10)
    # Subtle tonal modulation across track bands
    vinyl_base = np.full_like(r, 0.012)
    vinyl_base[track_mask > 0] += 0.008
    vinyl_base[gap_mask] = 0.008
    vinyl_base[outside_mask] = 0.02
    vinyl_base_img = np.stack([vinyl_base, vinyl_base, vinyl_base * 1.15, np.ones_like(r)], axis=-1)
    
    # Save vinyl textures
    p_norm = os.path.join(TEXTURES_DIR, "vinyl_normal.png")
    p_rough = os.path.join(TEXTURES_DIR, "vinyl_roughness.png")
    p_base = os.path.join(TEXTURES_DIR, "vinyl_basecolor.png")
    
    save_numpy_image("Vinyl_Normal", vinyl_norm_img, p_norm, colorspace="Non-Color")
    save_numpy_image("Vinyl_Roughness", vinyl_rough_img, p_rough, colorspace="Non-Color")
    save_numpy_image("Vinyl_BaseColor", vinyl_base_img, p_base, colorspace="sRGB")
    
    # --- B. VINTAGE GOLD CENTER LABEL ---
    # Label covers r in [0, 1] for its own UV space
    # Spindle hole at r < 0.08
    # Outer label rim at r = 0.98
    
    # Base antique gold palette
    # Rich warm gold gradient from center to rim
    gold_hue_r = 0.78 + 0.08 * (1.0 - r * 0.5)
    gold_hue_g = 0.60 + 0.06 * (1.0 - r * 0.5)
    gold_hue_b = 0.28 + 0.04 * (1.0 - r * 0.5)
    
    # Radial spun-metal sheen (lathe brush marks)
    spun_sheen = 1.0 + 0.045 * np.sin(theta * 60.0) + 0.025 * np.cos(theta * 240.0)
    
    # Concentric micro-rings
    micro_rings = 1.0 + 0.03 * np.sin(r * 220.0 * np.pi)
    
    lbl_r = gold_hue_r * spun_sheen * micro_rings
    lbl_g = gold_hue_g * spun_sheen * micro_rings
    lbl_b = gold_hue_b * spun_sheen * micro_rings
    
    # Concentric gold foil bands:
    # 1. Outer double polished rim (r in [0.91, 0.96])
    outer_rim_mask = ((r >= 0.92) & (r <= 0.96))
    lbl_r[outer_rim_mask] = 0.96
    lbl_g[outer_rim_mask] = 0.84
    lbl_b[outer_rim_mask] = 0.52
    
    # Outer border engraved groove
    outer_groove = ((r >= 0.908) & (r <= 0.918)) | ((r >= 0.962) & (r <= 0.972))
    lbl_r[outer_groove] *= 0.45
    lbl_g[outer_groove] *= 0.40
    lbl_b[outer_groove] *= 0.30
    
    # 2. Mid circular framing border (r in [0.62, 0.65])
    mid_ring = ((r >= 0.62) & (r <= 0.65))
    lbl_r[mid_ring] = 0.94
    lbl_g[mid_ring] = 0.80
    lbl_b[mid_ring] = 0.48
    
    mid_groove = ((r >= 0.612) & (r <= 0.620)) | ((r >= 0.650) & (r <= 0.658))
    lbl_r[mid_groove] *= 0.50
    lbl_g[mid_groove] *= 0.45
    lbl_b[mid_groove] *= 0.35
    
    # 3. Inner decorative accent rings (r in [0.78, 0.79], [0.46, 0.47])
    accent_rings = ((r >= 0.78) & (r <= 0.79)) | ((r >= 0.46) & (r <= 0.47))
    lbl_r[accent_rings] = 0.98
    lbl_g[accent_rings] = 0.86
    lbl_b[accent_rings] = 0.55
    
    # 4. Spindle collar brass ring (r in [0.12, 0.16])
    spindle_ring = ((r >= 0.12) & (r <= 0.16))
    lbl_r[spindle_ring] = 0.92
    lbl_g[spindle_ring] = 0.78
    lbl_b[spindle_ring] = 0.45
    
    # 5. Spindle hole rim border (r in [0.075, 0.085])
    hole_rim = ((r >= 0.075) & (r <= 0.085))
    lbl_r[hole_rim] *= 0.40
    lbl_g[hole_rim] *= 0.35
    lbl_b[hole_rim] *= 0.25
    
    # Clamp to valid color range
    lbl_r = np.clip(lbl_r, 0.0, 1.0)
    lbl_g = np.clip(lbl_g, 0.0, 1.0)
    lbl_b = np.clip(lbl_b, 0.0, 1.0)
    
    label_base_img = np.stack([lbl_r, lbl_g, lbl_b, np.ones_like(r)], axis=-1)
    
    # Label Roughness:
    # Highly polished gold foil on borders (~0.22)
    # Brushed satin field (~0.34)
    # Engraved grooves (~0.45)
    lbl_rough = np.full_like(r, 0.34)
    lbl_rough[outer_rim_mask | mid_ring | accent_rings | spindle_ring] = 0.22
    lbl_rough[outer_groove | mid_groove | hole_rim] = 0.45
    label_rough_img = np.stack([lbl_rough, lbl_rough, lbl_rough, np.ones_like(r)], axis=-1)
    
    # Label Normal (embossed concentric borders):
    lbl_dr = np.zeros_like(r)
    lbl_dr += np.cos((r - 0.94) / 0.02 * np.pi) * 0.35 * outer_rim_mask
    lbl_dr += np.cos((r - 0.635) / 0.015 * np.pi) * 0.30 * mid_ring
    lbl_dr += np.cos((r - 0.14) / 0.02 * np.pi) * 0.25 * spindle_ring
    
    lnx = -lbl_dr * np.cos(theta)
    lny = -lbl_dr * np.sin(theta)
    lnz = np.sqrt(np.clip(1.0 - (lnx**2 + lny**2), 0.001, 1.0))
    label_norm_img = np.stack([
        (lnx + 1.0) * 0.5,
        (lny + 1.0) * 0.5,
        (lnz + 1.0) * 0.5,
        np.ones_like(r)
    ], axis=-1)
    
    # Save label textures
    p_lbl_base = os.path.join(TEXTURES_DIR, "gold_label_basecolor.png")
    p_lbl_rough = os.path.join(TEXTURES_DIR, "gold_label_roughness.png")
    p_lbl_norm = os.path.join(TEXTURES_DIR, "gold_label_normal.png")
    
    save_numpy_image("Label_BaseColor", label_base_img, p_lbl_base, colorspace="sRGB")
    save_numpy_image("Label_Roughness", label_rough_img, p_lbl_rough, colorspace="Non-Color")
    save_numpy_image("Label_Normal", label_norm_img, p_lbl_norm, colorspace="Non-Color")
    
    print(f"All textures generated successfully in {time.time() - t0:.2f}s.")
    return {
        "vinyl_base": p_base,
        "vinyl_rough": p_rough,
        "vinyl_norm": p_norm,
        "label_base": p_lbl_base,
        "label_rough": p_lbl_rough,
        "label_norm": p_lbl_norm,
    }

# ---------------------------------------------------------------------------
# 2. Material Creation
# ---------------------------------------------------------------------------
def create_materials(tex_paths):
    print("Creating PBR materials for Blender & GLB export...")
    
    # --- A. Vinyl Material ---
    mat_vinyl = bpy.data.materials.new("M_Vinyl")
    nodes_v = mat_vinyl.node_tree.nodes
    links_v = mat_vinyl.node_tree.links
    nodes_v.clear()
    
    out_v = nodes_v.new("ShaderNodeOutputMaterial")
    out_v.location = (400, 0)
    
    bsdf_v = nodes_v.new("ShaderNodeBsdfPrincipled")
    bsdf_v.location = (0, 0)
    bsdf_v.inputs["Metallic"].default_value = 0.0
    bsdf_v.inputs["IOR"].default_value = 1.54
    if "Anisotropic" in bsdf_v.inputs:
        bsdf_v.inputs["Anisotropic"].default_value = 0.85
    if "Anisotropic Rotation" in bsdf_v.inputs:
        bsdf_v.inputs["Anisotropic Rotation"].default_value = 0.25
        
    links_v.new(bsdf_v.outputs["BSDF"], out_v.inputs["Surface"])
    
    # Vinyl Base Color
    img_v_base = bpy.data.images.load(tex_paths["vinyl_base"])
    tex_v_base = nodes_v.new("ShaderNodeTexImage")
    tex_v_base.image = img_v_base
    tex_v_base.location = (-400, 200)
    links_v.new(tex_v_base.outputs["Color"], bsdf_v.inputs["Base Color"])
    
    # Vinyl Roughness
    img_v_rough = bpy.data.images.load(tex_paths["vinyl_rough"])
    img_v_rough.colorspace_settings.name = "Non-Color"
    tex_v_rough = nodes_v.new("ShaderNodeTexImage")
    tex_v_rough.image = img_v_rough
    tex_v_rough.location = (-400, -50)
    links_v.new(tex_v_rough.outputs["Color"], bsdf_v.inputs["Roughness"])
    
    # Vinyl Normal
    img_v_norm = bpy.data.images.load(tex_paths["vinyl_norm"])
    img_v_norm.colorspace_settings.name = "Non-Color"
    tex_v_norm = nodes_v.new("ShaderNodeTexImage")
    tex_v_norm.image = img_v_norm
    tex_v_norm.location = (-600, -300)
    
    node_v_norm = nodes_v.new("ShaderNodeNormalMap")
    node_v_norm.location = (-300, -300)
    node_v_norm.inputs["Strength"].default_value = 1.0
    links_v.new(tex_v_norm.outputs["Color"], node_v_norm.inputs["Color"])
    links_v.new(node_v_norm.outputs["Normal"], bsdf_v.inputs["Normal"])
    
    # --- B. Vintage Gold Label Material ---
    mat_label = bpy.data.materials.new("M_Vintage_Gold_Label")
    nodes_l = mat_label.node_tree.nodes
    links_l = mat_label.node_tree.links
    nodes_l.clear()
    
    out_l = nodes_l.new("ShaderNodeOutputMaterial")
    out_l.location = (400, 0)
    
    bsdf_l = nodes_l.new("ShaderNodeBsdfPrincipled")
    bsdf_l.location = (0, 0)
    bsdf_l.inputs["Metallic"].default_value = 0.94
    if "Specular IOR Level" in bsdf_l.inputs:
        bsdf_l.inputs["Specular IOR Level"].default_value = 0.5
        
    links_l.new(bsdf_l.outputs["BSDF"], out_l.inputs["Surface"])
    
    # Label Base Color
    img_l_base = bpy.data.images.load(tex_paths["label_base"])
    tex_l_base = nodes_l.new("ShaderNodeTexImage")
    tex_l_base.image = img_l_base
    tex_l_base.location = (-400, 200)
    links_l.new(tex_l_base.outputs["Color"], bsdf_l.inputs["Base Color"])
    
    # Label Roughness
    img_l_rough = bpy.data.images.load(tex_paths["label_rough"])
    img_l_rough.colorspace_settings.name = "Non-Color"
    tex_l_rough = nodes_l.new("ShaderNodeTexImage")
    tex_l_rough.image = img_l_rough
    tex_l_rough.location = (-400, -50)
    links_l.new(tex_l_rough.outputs["Color"], bsdf_l.inputs["Roughness"])
    
    # Label Normal
    img_l_norm = bpy.data.images.load(tex_paths["label_norm"])
    img_l_norm.colorspace_settings.name = "Non-Color"
    tex_l_norm = nodes_l.new("ShaderNodeTexImage")
    tex_l_norm.image = img_l_norm
    tex_l_norm.location = (-600, -300)
    
    node_l_norm = nodes_l.new("ShaderNodeNormalMap")
    node_l_norm.location = (-300, -300)
    node_l_norm.inputs["Strength"].default_value = 0.8
    links_l.new(tex_l_norm.outputs["Color"], node_l_norm.inputs["Color"])
    links_l.new(node_l_norm.outputs["Normal"], bsdf_l.inputs["Normal"])
    
    return mat_vinyl, mat_label

# ---------------------------------------------------------------------------
# 3. Geometry Construction
# ---------------------------------------------------------------------------
def build_geometry(mat_vinyl, mat_label, n_radial=96):
    print(f"Building vinyl record geometry ({n_radial} radial subdivisions)...")
    
    # Clean default objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Root Empty for Web / Browser Animation
    # Centered at (0, 0, 0), rotation (0, 0, 0), scale (1, 1, 1)
    root_obj = bpy.data.objects.new("Vinyl_Root", None)
    root_obj.empty_display_type = 'PLAIN_AXES'
    root_obj.empty_display_size = 1.6
    root_obj.location = (0, 0, 0)
    bpy.context.scene.collection.objects.link(root_obj)
    
    # --- A. Build Vinyl Body Mesh ---
    mesh_v = bpy.data.meshes.new("Vinyl_Body_Mesh")
    bm_v = bmesh.new()
    uv_v = bm_v.loops.layers.uv.new("UVMap")
    
    # Radii profile (from spindle hole to outer rim)
    # Radii in Blender units (LP radius = 1.50)
    radii_v = [0.038, 0.24, 0.48, 0.60, 0.76, 0.92, 1.08, 1.24, 1.38, 1.45, 1.492]
    r_outer = 1.500
    z_top = 0.016
    z_bot = -0.016
    angles = [2.0 * np.pi * i / n_radial for i in range(n_radial)]
    
    top_rings = [[bm_v.verts.new((r * np.cos(a), r * np.sin(a), z_top)) for a in angles] for r in radii_v]
    mid_ring  = [bm_v.verts.new((r_outer * np.cos(a), r_outer * np.sin(a), 0.0)) for a in angles]
    bot_rings = [[bm_v.verts.new((r * np.cos(a), r * np.sin(a), z_bot)) for a in angles] for r in radii_v]
    
    # Top face rings
    for i in range(len(radii_v) - 1):
        r1, r2 = top_rings[i], top_rings[i+1]
        for j in range(n_radial):
            jn = (j + 1) % n_radial
            f = bm_v.faces.new((r1[j], r1[jn], r2[jn], r2[j]))
            for loop in f.loops:
                loop[uv_v].uv = (loop.vert.co.x / 3.0 + 0.5, loop.vert.co.y / 3.0 + 0.5)
                
    # Outer beveled edge (top to mid, mid to bottom)
    r_top_out = top_rings[-1]
    for j in range(n_radial):
        jn = (j + 1) % n_radial
        f = bm_v.faces.new((r_top_out[j], r_top_out[jn], mid_ring[jn], mid_ring[j]))
        for loop in f.loops:
            loop[uv_v].uv = (loop.vert.co.x / 3.0 + 0.5, loop.vert.co.y / 3.0 + 0.5)
            
    r_bot_out = bot_rings[-1]
    for j in range(n_radial):
        jn = (j + 1) % n_radial
        f = bm_v.faces.new((mid_ring[j], mid_ring[jn], r_bot_out[jn], r_bot_out[j]))
        for loop in f.loops:
            loop[uv_v].uv = (loop.vert.co.x / 3.0 + 0.5, loop.vert.co.y / 3.0 + 0.5)
            
    # Bottom face rings
    for i in range(len(radii_v) - 1):
        r1, r2 = bot_rings[i], bot_rings[i+1]
        for j in range(n_radial):
            jn = (j + 1) % n_radial
            f = bm_v.faces.new((r2[j], r2[jn], r1[jn], r1[j]))
            for loop in f.loops:
                loop[uv_v].uv = (-loop.vert.co.x / 3.0 + 0.5, loop.vert.co.y / 3.0 + 0.5)
                
    # Spindle hole inner cylinder
    r_top_in = top_rings[0]
    r_bot_in = bot_rings[0]
    for j in range(n_radial):
        jn = (j + 1) % n_radial
        f = bm_v.faces.new((r_bot_in[j], r_bot_in[jn], r_top_in[jn], r_top_in[j]))
        for loop in f.loops:
            loop[uv_v].uv = (j / n_radial, (loop.vert.co.z - z_bot) / (z_top - z_bot))
            
    bmesh.ops.recalc_face_normals(bm_v, faces=bm_v.faces)
    for f in bm_v.faces:
        f.smooth = True
        
    bm_v.to_mesh(mesh_v)
    bm_v.free()
    
    obj_vinyl = bpy.data.objects.new("Vinyl_Body", mesh_v)
    obj_vinyl.data.materials.append(mat_vinyl)
    obj_vinyl.parent = root_obj
    obj_vinyl.location = (0, 0, 0)
    bpy.context.scene.collection.objects.link(obj_vinyl)
    
    # --- B. Build Vintage Gold Center Label Mesh ---
    mesh_l = bpy.data.meshes.new("Vinyl_Label_Mesh")
    bm_l = bmesh.new()
    uv_l = bm_l.loops.layers.uv.new("UVMap")
    
    r_label_in = 0.038
    r_label_out = 0.480
    z_lbl_top = 0.0166  # Micro-raised to avoid z-fighting with vinyl body
    z_lbl_bot = -0.0166
    
    radii_lbl = [r_label_in, 0.15, 0.30, r_label_out]
    
    top_lbl_rings = [[bm_l.verts.new((r * np.cos(a), r * np.sin(a), z_lbl_top)) for a in angles] for r in radii_lbl]
    bot_lbl_rings = [[bm_l.verts.new((r * np.cos(a), r * np.sin(a), z_lbl_bot)) for a in angles] for r in radii_lbl]
    
    # Top label faces
    for i in range(len(radii_lbl) - 1):
        r1, r2 = top_lbl_rings[i], top_lbl_rings[i+1]
        for j in range(n_radial):
            jn = (j + 1) % n_radial
            f = bm_l.faces.new((r1[j], r1[jn], r2[jn], r2[j]))
            for loop in f.loops:
                loop[uv_l].uv = (loop.vert.co.x / (2.0 * r_label_out) + 0.5, loop.vert.co.y / (2.0 * r_label_out) + 0.5)
                
    # Bottom label faces
    for i in range(len(radii_lbl) - 1):
        r1, r2 = bot_lbl_rings[i], bot_lbl_rings[i+1]
        for j in range(n_radial):
            jn = (j + 1) % n_radial
            f = bm_l.faces.new((r2[j], r2[jn], r1[jn], r1[j]))
            for loop in f.loops:
                loop[uv_l].uv = (-loop.vert.co.x / (2.0 * r_label_out) + 0.5, loop.vert.co.y / (2.0 * r_label_out) + 0.5)
                
    # Outer label edge rim
    r_lbl_top_out = top_lbl_rings[-1]
    r_lbl_bot_out = bot_lbl_rings[-1]
    for j in range(n_radial):
        jn = (j + 1) % n_radial
        f = bm_l.faces.new((r_lbl_top_out[j], r_lbl_top_out[jn], r_lbl_bot_out[jn], r_lbl_bot_out[j]))
        for loop in f.loops:
            loop[uv_l].uv = (j / n_radial, (loop.vert.co.z - z_lbl_bot) / (z_lbl_top - z_lbl_bot))
            
    # Inner spindle hole rim
    r_lbl_top_in = top_lbl_rings[0]
    r_lbl_bot_in = bot_lbl_rings[0]
    for j in range(n_radial):
        jn = (j + 1) % n_radial
        f = bm_l.faces.new((r_lbl_bot_in[j], r_lbl_bot_in[jn], r_lbl_top_in[jn], r_lbl_top_in[j]))
        for loop in f.loops:
            loop[uv_l].uv = (j / n_radial, (loop.vert.co.z - z_lbl_bot) / (z_lbl_top - z_lbl_bot))
            
    bmesh.ops.recalc_face_normals(bm_l, faces=bm_l.faces)
    for f in bm_l.faces:
        f.smooth = True
        
    bm_l.to_mesh(mesh_l)
    bm_l.free()
    
    obj_label = bpy.data.objects.new("Vinyl_Label", mesh_l)
    obj_label.data.materials.append(mat_label)
    obj_label.parent = root_obj
    obj_label.location = (0, 0, 0)
    bpy.context.scene.collection.objects.link(obj_label)
    
    print(f"Geometry built:")
    print(f"  Vinyl_Body:  {len(mesh_v.vertices)} verts, {len(mesh_v.polygons)} faces")
    print(f"  Vinyl_Label: {len(mesh_l.vertices)} verts, {len(mesh_l.polygons)} faces")
    print(f"  Hierarchy:   Vinyl_Root -> [Vinyl_Body, Vinyl_Label] at (0,0,0)")
    return root_obj, obj_vinyl, obj_label

# ---------------------------------------------------------------------------
# 4. Cinematic Studio Setup (Lighting, Backdrop, Camera)
# ---------------------------------------------------------------------------
def setup_studio_and_camera(root_obj, obj_label):
    print("Setting up cinematic studio lighting & typography-friendly camera...")
    scene = bpy.context.scene
    
    # Render Settings (Cycles for photorealism)
    import addon_utils
    addon_utils.enable("cycles")
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    
    # World Background (Dark charcoal ambience)
    world = bpy.data.worlds.new("Studio_World")
    wnodes = world.node_tree.nodes
    wbg = wnodes.get("Background")
    wbg.inputs["Color"].default_value = (0.010, 0.010, 0.012, 1.0) # Deep charcoal #0a0a0c
    wbg.inputs["Strength"].default_value = 0.35
    scene.world = world
    
    # Studio Backdrop plane (Lowered so floating vinyl does not clip)
    mesh_b = bpy.data.meshes.new("Backdrop_Mesh")
    bm_b = bmesh.new()
    bmesh.ops.create_grid(bm_b, x_segments=16, y_segments=16, size=22.0)
    for v in bm_b.verts:
        if v.co.y > 1.0:
            v.co.z += (v.co.y - 1.0)**1.6 * 0.35
    bm_b.to_mesh(mesh_b)
    bm_b.free()
    
    backdrop = bpy.data.objects.new("Studio_Backdrop", mesh_b)
    backdrop.location = (0, 2.0, -1.6)
    
    mat_back = bpy.data.materials.new("M_Backdrop")
    bbsdf = mat_back.node_tree.nodes.get("Principled BSDF")
    bbsdf.inputs["Base Color"].default_value = (0.014, 0.014, 0.017, 1.0) # Matte charcoal
    bbsdf.inputs["Roughness"].default_value = 0.90
    if "Specular IOR Level" in bbsdf.inputs:
        bbsdf.inputs["Specular IOR Level"].default_value = 0.15
    backdrop.data.materials.append(mat_back)
    scene.collection.objects.link(backdrop)
    
    # Studio Lighting (Cinematic warm amber & restrained reflections)
    # Light 1: Warm Amber Key Rim Light (Rakes across sound grooves)
    l_key_data = bpy.data.lights.new("Amber_Rim_Key", type='AREA')
    l_key_data.color = (1.0, 0.70, 0.32) # Warm 2800K amber
    l_key_data.energy = 650.0
    l_key_data.size = 2.0
    l_key_data.size_y = 0.6
    l_key_obj = bpy.data.objects.new("Amber_Rim_Key", l_key_data)
    l_key_obj.location = (3.6, -1.2, 4.0)
    l_key_obj.rotation_euler = (np.radians(48), np.radians(20), np.radians(35))
    scene.collection.objects.link(l_key_obj)
    
    # Light 2: Kaanch Ke Theke Lantern Warm Glow
    l_glow_data = bpy.data.lights.new("Theka_Lantern_Glow", type='POINT')
    l_glow_data.color = (1.0, 0.52, 0.16) # Rich lantern amber
    l_glow_data.energy = 220.0
    l_glow_data.shadow_soft_size = 0.5
    l_glow_obj = bpy.data.objects.new("Theka_Lantern_Glow", l_glow_data)
    l_glow_obj.location = (-2.8, -2.2, 1.8)
    scene.collection.objects.link(l_glow_obj)
    
    # Light 3: Vintage Gold Label Overhead Softbox
    l_lbl_data = bpy.data.lights.new("Label_Softbox", type='AREA')
    l_lbl_data.color = (1.0, 0.94, 0.85) # Warm neutral soft daylight
    l_lbl_data.energy = 260.0
    l_lbl_data.size = 1.4
    l_lbl_obj = bpy.data.objects.new("Label_Softbox", l_lbl_data)
    l_lbl_obj.location = (0.9, -1.2, 4.0)
    l_lbl_obj.rotation_euler = (np.radians(36), 0, 0)
    scene.collection.objects.link(l_lbl_obj)
    
    # Light 4: Cool Slate Silhouette Rim Fill
    l_rim_data = bpy.data.lights.new("Slate_Silhouette_Rim", type='AREA')
    l_rim_data.color = (0.70, 0.80, 0.96) # Cool slate contrast
    l_rim_data.energy = 85.0
    l_rim_data.size = 2.2
    l_rim_obj = bpy.data.objects.new("Slate_Silhouette_Rim", l_rim_data)
    l_rim_obj.location = (-1.0, 3.5, 2.0)
    l_rim_obj.rotation_euler = (np.radians(130), np.radians(0), np.radians(160))
    scene.collection.objects.link(l_rim_obj)
    
    # Camera Composition:
    # 58mm lens with shift_x: -0.16
    # Frames the vinyl heroically on the right while leaving the left 45% clear for hero text
    cam_data = bpy.data.cameras.new("Cinematic_Camera")
    cam_data.lens = 58.0
    cam_data.sensor_width = 36.0
    cam_data.shift_x = -0.16
    
    # Depth of Field focused on the gold label rim
    cam_data.dof.use_dof = True
    cam_data.dof.focus_object = obj_label
    cam_data.dof.aperture_fstop = 5.6
    
    cam_obj = bpy.data.objects.new("Cinematic_Camera", cam_data)
    cam_obj.location = (0.0, -6.5, 4.4)
    cam_obj.rotation_euler = (np.radians(54), 0, 0)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    # Orientation for the cinematic preview render:
    # Floating gracefully above the studio floor, tilted 36 degrees towards the viewer
    root_obj.location = (0.55, 0.0, 0.45)
    root_obj.rotation_euler = (np.radians(36), np.radians(-10), np.radians(-15))
    
    print(f"Studio & camera configured:")
    print(f"  Camera lens: 58mm, shift_x: -0.16 (negative space for typography), f/5.6 DOF")
    print(f"  Lighting: Amber Rim Key (650W), Lantern Glow (220W), Label Softbox (260W), Slate Rim (85W)")
    return cam_obj, [backdrop, l_key_obj, l_glow_obj, l_lbl_obj, l_rim_obj]

# ---------------------------------------------------------------------------
# 5. Export Web GLB Asset
# ---------------------------------------------------------------------------
def export_web_glb(root_obj, obj_vinyl, obj_label):
    print("Exporting web-compatible GLB asset...")
    
    # Ensure root rotation and location are reset to standard (0, 0, 0) for the exported web model
    # so browser code (React Three Fiber / GSAP) can rotate it cleanly around Z or Y axis
    current_loc = tuple(root_obj.location)
    current_rot = tuple(root_obj.rotation_euler)
    root_obj.location = (0, 0, 0)
    root_obj.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
    
    # Select only the vinyl record hierarchy (Root + Body + Label)
    bpy.ops.object.select_all(action='DESELECT')
    root_obj.select_set(True)
    obj_vinyl.select_set(True)
    obj_label.select_set(True)
    bpy.context.view_layer.objects.active = root_obj
    
    # Check if target file already exists
    if os.path.exists(GLB_FILEPATH):
        print(f"  Notice: GLB file already exists at {GLB_FILEPATH}, updating asset.")
    
    # Export GLB with embedded textures and PBR materials
    bpy.ops.export_scene.gltf(
        filepath=GLB_FILEPATH,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    
    # Restore scene transform for the .blend preview
    root_obj.location = current_loc
    root_obj.rotation_euler = current_rot
    bpy.context.view_layer.update()
    
    glb_size_bytes = os.path.getsize(GLB_FILEPATH)
    glb_size_mb = glb_size_bytes / (1024 * 1024)
    print(f"GLB asset exported successfully to: {GLB_FILEPATH}")
    print(f"  File size: {glb_size_bytes:,} bytes ({glb_size_mb:.2f} MB)")
    return GLB_FILEPATH, glb_size_bytes

# ---------------------------------------------------------------------------
# 6. Render Cinematic Preview & Save .blend
# ---------------------------------------------------------------------------
def render_preview_and_save_blend():
    print(f"Rendering cinematic preview to {PREVIEW_FILEPATH}...")
    scene = bpy.context.scene
    scene.render.filepath = PREVIEW_FILEPATH
    
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    render_time = time.time() - t0
    
    preview_size = os.path.getsize(PREVIEW_FILEPATH)
    print(f"Preview render complete in {render_time:.1f}s ({preview_size:,} bytes).")
    
    # Save the editable .blend file
    print(f"Saving editable .blend file to {BLEND_FILEPATH}...")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_FILEPATH)
    blend_size = os.path.getsize(BLEND_FILEPATH)
    print(f".blend file saved ({blend_size:,} bytes).")
    
    return PREVIEW_FILEPATH, BLEND_FILEPATH

# ---------------------------------------------------------------------------
# 7. Verification Routine
# ---------------------------------------------------------------------------
def verify_outputs(glb_path, blend_path, preview_path):
    print("\n" + "="*60)
    print("VERIFICATION OF GENERATED ARTIFACTS")
    print("="*60)
    
    results = {}
    
    # 1. Preview render check
    preview_exists = os.path.exists(preview_path)
    preview_size = os.path.getsize(preview_path) if preview_exists else 0
    results["preview_render"] = {
        "path": preview_path,
        "exists": preview_exists,
        "size_bytes": preview_size,
        "valid": preview_exists and preview_size > 0
    }
    print(f"1. Preview Render:   {'PASS' if results['preview_render']['valid'] else 'FAIL'}")
    print(f"   Path: {preview_path} ({preview_size:,} bytes)")
    
    # 2. Blend file check
    blend_exists = os.path.exists(blend_path)
    blend_size = os.path.getsize(blend_path) if blend_exists else 0
    results["blend_file"] = {
        "path": blend_path,
        "exists": blend_exists,
        "size_bytes": blend_size,
        "valid": blend_exists and blend_size > 0
    }
    print(f"2. Editable .blend:  {'PASS' if results['blend_file']['valid'] else 'FAIL'}")
    print(f"   Path: {blend_path} ({blend_size:,} bytes)")
    
    # 3. GLB file check & internal inspection
    glb_exists = os.path.exists(glb_path)
    glb_size = os.path.getsize(glb_path) if glb_exists else 0
    
    # Read glTF header and JSON chunk
    gltf_manifest = {}
    if glb_exists and glb_size > 20:
        with open(glb_path, 'rb') as f:
            magic = f.read(4)
            version = int.from_bytes(f.read(4), 'little')
            length = int.from_bytes(f.read(4), 'little')
            chunk_len = int.from_bytes(f.read(4), 'little')
            chunk_type = f.read(4)
            if chunk_type == b'JSON':
                gltf_manifest = json.loads(f.read(chunk_len).decode('utf-8'))
                
    nodes = [n.get('name') for n in gltf_manifest.get('nodes', [])]
    materials = [m.get('name') for m in gltf_manifest.get('materials', [])]
    textures_count = len(gltf_manifest.get('textures', []))
    images_count = len(gltf_manifest.get('images', []))
    
    hierarchy_valid = "Vinyl_Root" in nodes and "Vinyl_Body" in nodes and "Vinyl_Label" in nodes
    materials_valid = "M_Vinyl" in materials and "M_Vintage_Gold_Label" in materials
    
    results["glb_asset"] = {
        "path": glb_path,
        "exists": glb_exists,
        "size_bytes": glb_size,
        "nodes": nodes,
        "materials": materials,
        "embedded_textures": textures_count,
        "embedded_images": images_count,
        "valid": glb_exists and glb_size > 0 and hierarchy_valid and materials_valid
    }
    
    print(f"3. Web GLB Asset:    {'PASS' if results['glb_asset']['valid'] else 'FAIL'}")
    print(f"   Path: {glb_path} ({glb_size:,} bytes)")
    print(f"   Nodes in GLB:     {nodes}")
    print(f"   Materials in GLB: {materials}")
    print(f"   Embedded images:  {images_count}")
    print(f"   Embedded textures:{textures_count}")
    print("="*60 + "\n")
    return results

# ---------------------------------------------------------------------------
# Main Execution Pipeline
# ---------------------------------------------------------------------------
def main():
    print("Starting Vinyl Record Generation Pipeline...")
    t_start = time.time()
    
    # 1. Generate high-res PBR textures
    tex_paths = generate_textures(res=2048)
    
    # 2. Setup PBR materials
    mat_vinyl, mat_label = create_materials(tex_paths)
    
    # 3. Build geometry
    root_obj, obj_vinyl, obj_label = build_geometry(mat_vinyl, mat_label, n_radial=96)
    
    # 4. Setup studio lighting & camera
    cam_obj, studio_objs = setup_studio_and_camera(root_obj, obj_label)
    
    # 5. Export web-ready GLB
    glb_path, glb_size = export_web_glb(root_obj, obj_vinyl, obj_label)
    
    # 6. Render preview & save .blend file
    preview_path, blend_path = render_preview_and_save_blend()
    
    # 7. Verify all outputs
    results = verify_outputs(glb_path, blend_path, preview_path)
    
    print(f"Pipeline finished successfully in {time.time() - t_start:.1f}s.")

if __name__ == "__main__":
    main()
