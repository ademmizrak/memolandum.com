import pypdf
import os

pdf_path = r"C:\Users\adem_\.gemini\antigravity\brain\6db2ddac-ecb8-4cc2-9f55-f58f20e1a058\media__1782199633808.pdf"
output_path = r"d:\000Memorade\scratch\prd_text.txt"

reader = pypdf.PdfReader(pdf_path)
text = ""
for i, page in enumerate(reader.pages):
    text += f"--- Page {i+1} ---\n"
    text += page.extract_text() + "\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(text)

print("PDF text extracted successfully to", output_path)
