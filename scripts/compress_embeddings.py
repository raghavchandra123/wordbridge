import json
import numpy as np
from pathlib import Path
import gzip

def compress_embeddings(input_file: str, output_dir: str, chunk_size: int = 10000):
    """
    Compress and chunk embeddings dictionary using float16 and gzip compression.
    
    Args:
        input_file: Path to concept_embeds.json
        output_dir: Directory to save compressed chunks
        chunk_size: Number of words per chunk
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load original embeddings
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Convert to list of tuples for chunking
    items = list(data.items())
    
    # Process in chunks
    for i in range(0, len(items), chunk_size):
        chunk = dict(items[i:i + chunk_size])
        
        # Convert values to float16
        compressed_chunk = {
            word: np.array(vector, dtype=np.float16).tobytes()
            for word, vector in chunk.items()
        }
        
        # Save compressed chunk
        chunk_file = output_path / f'embeddings_chunk_{i//chunk_size}.gz'
        with gzip.open(chunk_file, 'wb') as f:
            f.write(json.dumps(compressed_chunk).encode('utf-8'))

if __name__ == '__main__':
    compress_embeddings(
        'concept_embeds.json',
        'public/data/embeddings_chunks'
    )