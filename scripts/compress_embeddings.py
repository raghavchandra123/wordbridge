import json
import numpy as np
from pathlib import Path
import gzip
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def compress_embeddings(
    input_file: str,
    output_dir: str,
    chunk_size: int = 10000,
    compression_level: int = 9
) -> None:
    """
    Compress and chunk embeddings dictionary using float16 precision and gzip compression.
    
    Strategy:
    1. Convert float32 vectors to float16 (halves memory usage)
    2. Chunk the dictionary into smaller files (improves loading time)
    3. Use gzip compression with maximum level (reduces file size)
    
    Args:
        input_file: Path to concept_embeds.json
        output_dir: Directory to save compressed chunks
        chunk_size: Number of words per chunk
        compression_level: gzip compression level (1-9, higher = better compression)
    """
    logger.info(f"Starting compression of {input_file}")
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load original embeddings
    logger.info("Loading embeddings file...")
    with open(input_file, 'r') as f:
        data: Dict[str, List[float]] = json.load(f)
    
    # Convert to list of tuples for chunking
    items: List[Tuple[str, List[float]]] = list(data.items())
    total_chunks = len(items) // chunk_size + (1 if len(items) % chunk_size else 0)
    
    logger.info(f"Processing {len(items)} words in {total_chunks} chunks")
    
    # Process in chunks
    for i in range(0, len(items), chunk_size):
        chunk_num = i // chunk_size
        chunk = dict(items[i:i + chunk_size])
        
        # Convert values to float16 and then to bytes
        compressed_chunk = {
            word: np.array(vector, dtype=np.float16).tobytes()
            for word, vector in chunk.items()
        }
        
        # Save compressed chunk with maximum compression
        chunk_file = output_path / f'embeddings_chunk_{chunk_num}.gz'
        with gzip.open(chunk_file, 'wb', compresslevel=compression_level) as f:
            f.write(json.dumps(compressed_chunk).encode('utf-8'))
        
        logger.info(f"Processed chunk {chunk_num + 1}/{total_chunks}")
    
    logger.info("Compression complete!")

if __name__ == '__main__':
    compress_embeddings(
        input_file='concept_embeds.json',
        output_dir='public/data/embeddings_chunks',
        chunk_size=10000,  # Adjust based on your needs
        compression_level=9
    )