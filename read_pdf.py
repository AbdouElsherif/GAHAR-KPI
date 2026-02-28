import PyPDF2
import glob
import os

# Find the PDF file
pdf_files = glob.glob(os.path.join(os.path.dirname(__file__), '*صحي*.pdf'))
if not pdf_files:
    pdf_files = glob.glob(os.path.join(os.path.dirname(__file__), '*.pdf'))

for pdf_file in pdf_files:
    print(f"=== Found PDF: {os.path.basename(pdf_file)} ===")
    reader = PyPDF2.PdfReader(pdf_file)
    print(f"Total pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            print(f"\n--- Page {i+1} ---")
            print(text)
