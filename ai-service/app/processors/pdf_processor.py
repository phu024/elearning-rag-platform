"""PDF text extraction processor"""
import logging
from typing import List, Dict, Any
from pathlib import Path
import PyPDF2

logger = logging.getLogger(__name__)


async def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from PDF file with page numbers
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        List of dicts with {text, page_number, metadata}
    """
    try:
        pages_data = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            
            logger.info(f"Processing PDF with {total_pages} pages: {file_path}")
            
            for page_num, page in enumerate(pdf_reader.pages, start=1):
                try:
                    text = page.extract_text()
                    
                    if text and text.strip():
                        pages_data.append({
                            'text': text.strip(),
                            'page_number': page_num,
                            'metadata': {
                                'total_pages': total_pages,
                                'page_number': page_num,
                                'source_type': 'pdf'
                            }
                        })
                        logger.debug(f"Extracted {len(text)} characters from page {page_num}")
                except Exception as e:
                    logger.error(f"Error extracting text from page {page_num}: {str(e)}")
                    # Continue with next page
                    continue
            
            logger.info(f"Successfully extracted text from {len(pages_data)} pages")
            return pages_data
            
    except Exception as e:
        logger.error(f"Error processing PDF file {file_path}: {str(e)}")
        raise Exception(f"Failed to process PDF: {str(e)}")
