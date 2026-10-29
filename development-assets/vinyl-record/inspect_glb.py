import json
import os
import struct

def inspect_glb(glb_path):
    print("=" * 60)
    print(f"Inspecting GLB: {glb_path}")
    print("=" * 60)
    file_size = os.path.getsize(glb_path)
    print(f"Total File Size: {file_size:,} bytes ({file_size / (1024 * 1024):.2f} MB)")
    
    with open(glb_path, 'rb') as f:
        magic = f.read(4)
        version = int.from_bytes(f.read(4), 'little')
        length = int.from_bytes(f.read(4), 'little')
        
        chunk_len = int.from_bytes(f.read(4), 'little')
        chunk_type = f.read(4)
        if chunk_type != b'JSON':
            print("Error: First chunk is not JSON")
            return
            
        json_data = f.read(chunk_len).decode('utf-8')
        manifest = json.loads(json_data)
        
        bin_chunk_offset = 12 + 8 + chunk_len
        f.seek(bin_chunk_offset)
        bin_chunk_len = int.from_bytes(f.read(4), 'little')
        bin_chunk_type = f.read(4)
        bin_data_start = bin_chunk_offset + 8
        
        images = manifest.get('images', [])
        buffer_views = manifest.get('bufferViews', [])
        materials = manifest.get('materials', [])
        textures = manifest.get('textures', [])
        nodes = manifest.get('nodes', [])
        meshes = manifest.get('meshes', [])
        extensions_used = manifest.get('extensionsUsed', [])
        extensions_required = manifest.get('extensionsRequired', [])
        
        print(f"glTF Version: {version}")
        print(f"Extensions Used: {extensions_used}")
        print(f"Extensions Required: {extensions_required}")
        print(f"Nodes: {[n.get('name') for n in nodes]}")
        print(f"Meshes: {[m.get('name') for m in meshes]}")
        print(f"Materials: {[m.get('name') for m in materials]}")
        print(f"\nEmbedded Images ({len(images)}):")
        
        total_image_bytes = 0
        for i, img in enumerate(images):
            bv_idx = img.get('bufferView')
            bv = buffer_views[bv_idx]
            byte_length = bv.get('byteLength', 0)
            total_image_bytes += byte_length
            mime = img.get('mimeType')
            name = img.get('name', f'image_{i}')
            print(f"  [{i}] {name}: {mime}, {byte_length:,} bytes ({byte_length / (1024 * 1024):.2f} MB)")
            
        print(f"\nTotal image data: {total_image_bytes:,} bytes ({total_image_bytes / (1024 * 1024):.2f} MB)")
        geom_bytes = file_size - total_image_bytes
        print(f"Estimated geometry/meta data: {geom_bytes:,} bytes ({geom_bytes / 1024:.2f} KB)")
        print("=" * 60)

if __name__ == '__main__':
    inspect_glb('public/models/vinyl-record.glb')
