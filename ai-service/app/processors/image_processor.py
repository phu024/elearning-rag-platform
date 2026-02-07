"""Image OCR text extraction"""
import logging
from typing import List, Dict, Any
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)


async def extract_text_from_image(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from image using Tesseract OCR
    
    Args:
        file_path: Path to image file
        
    Returns:
        List with dict containing {text, metadata}
    """
    try:
        logger.info(f"Processing image with OCR: {file_path}")
        
        # Open image
        image = Image.open(file_path)
        
        # Get image info
        width, height = image.size
        format_name = image.format
        
        # Perform OCR
        text = pytesseract.image_to_string(image)
        
        if not text.strip():
            logger.warning(f"No text extracted from image: {file_path}")
            return []
        
        # Get OCR data with confidence scores
        try:
            ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            avg_confidence = sum(
                int(conf) for conf in ocr_data['conf'] if int(conf) > 0
            ) / len([conf for conf in ocr_data['conf'] if int(conf) > 0])
        except Exception:
            avg_confidence = None
        
        result = [{
            'text': text.strip(),
            'metadata': {
                'source_type': 'image_ocr',
                'image_width': width,
                'image_height': height,
                'image_format': format_name,
                'ocr_confidence': avg_confidence
            }
        }]
        
        logger.info(f"Extracted {len(text)} characters from image")
        return result
        
    except Exception as e:
        logger.error(f"Error processing image {file_path}: {str(e)}")
        raise Exception(f"Failed to process image: {str(e)}")
