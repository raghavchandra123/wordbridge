import json
import struct
import os
import zlib  # Using zlib instead of gzip for raw DEFLATE
from pathlib import Path

# Create output directory in the public folder
output_dir = Path('./public/data/words')
output_dir.mkdir(parents=True, exist_ok=True)

# Load the JSON file
print("Loading JSON file...")
with open('concept_embeds2.json', 'r') as f:
    word_vectors = json.load(f)

print(f"Processing {len(word_vectors)} words...")
count = 0
errors = []

# Process each word-vector pair
for word, vector in word_vectors.items():
    # Skip empty or invalid words
    if not word or not isinstance(vector, list):
        print(f"Skipping invalid entry for word: '{word}'")
        continue
        
    # Ensure vector is the correct length
    if len(vector) != 300:
        print(f"Warning: Vector for word '{word}' has incorrect length: {len(vector)}")
        continue
    
    # Create binary file format:
    # - First 4 bytes: uint32 vector length (300)
    # - Following bytes: float32 array (300 * 4 bytes = 1200 bytes)
    filename = output_dir / f"{word}.vec"  # No .gz extension since we're not using gzip
    
    try:
        # First create the binary data
        binary_data = bytearray()
        # Write vector length as uint32 (4 bytes)
        binary_data.extend(struct.pack('<I', 300))  # Using little-endian format
        # Write vector data as float32 array
        binary_data.extend(struct.pack('<300f', *vector))  # Using little-endian format
        
        # Create a new compressor for each word
        compressor = zlib.compressobj(level=9, wbits=-15)
        # Compress using raw DEFLATE
        compressed_data = compressor.compress(binary_data) + compressor.flush()
        
        # Write the compressed data
        with open(filename, 'wb') as f:
            f.write(compressed_data)
        
        # Verify the file was written correctly
        try:
            with open(filename, 'rb') as f:
                compressed = f.read()
                # Decompress using raw DEFLATE
                decompressed = zlib.decompress(compressed, wbits=-15)
                if len(decompressed) != 1204:  # 4 bytes for length + 1200 bytes for vector
                    raise ValueError(f"Generated file has incorrect size: {len(decompressed)} bytes")
        except Exception as e:
            os.remove(filename)
            raise Exception(f"Verification failed: {str(e)}")
        
        count += 1
        if count % 1000 == 0:
            print(f"Processed {count} words...")
            
    except Exception as e:
        errors.append(f"Error processing word '{word}': {str(e)}")
        # If file was created but is invalid, remove it
        if filename.exists():
            os.remove(filename)

print(f"\nConversion complete! Successfully processed {count} words.")
if errors:
    print("\nErrors encountered:")
    for error in errors[:10]:  # Show first 10 errors
        print(error)
    if len(errors) > 10:
        print(f"...and {len(errors) - 10} more errors")