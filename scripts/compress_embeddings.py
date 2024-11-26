import json
import struct
import os
import gzip
from pathlib import Path

# Create output directory
output_dir = Path('./words')
output_dir.mkdir(exist_ok=True)

# Load the JSON file
print("Loading JSON file...")
with open('concept_embeds2.json', 'r') as f:
    word_vectors = json.load(f)

print(f"Processing {len(word_vectors)} words...")
count = 0

# Process each word-vector pair
for word, vector in word_vectors.items():
    # Create binary file format:
    # - First 4 bytes: uint32 vector length (300)
    # - Following bytes: float32 array (300 * 4 bytes)
    
    vec_length = len(vector)
    filename = output_dir / f"{word}.vec.gz"
    
    try:
        # First create the binary data
        binary_data = bytearray()
        # Write vector length
        binary_data.extend(struct.pack('I', vec_length))
        # Write vector data
        binary_data.extend(struct.pack(f'{vec_length}f', *vector))
        
        # Compress and write to file
        with gzip.open(filename, 'wb', compresslevel=9) as f:
            f.write(binary_data)
        
        count += 1
        if count % 1000 == 0:
            print(f"Processed {count} words...")
            
    except Exception as e:
        print(f"Error processing word '{word}': {e}")

print(f"Conversion complete! Processed {count} words.")