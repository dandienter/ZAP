import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn
import win32com.client
import pypdfium2 as pdfium

def set_cell_margins(cell, top=35, bottom=35, left=40, right=40):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_horizontal_divider(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(10)
    pBdr = parse_xml(r'<w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                     r'<w:bottom w:val="single" w:sz="12" w:space="1" w:color="000000"/>'
                     r'</w:pBdr>')
    p._p.get_or_add_pPr().append(pBdr)

def build_doc(output_docx, title_text):
    doc = docx.Document()

    # Page Setup: A4
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(0.9)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    p_title.paragraph_format.line_spacing = 1.15
    run1 = p_title.add_run("SURAT PERNYATAAN ORISINALITAS DAN INTEGRITAS KARYA")
    run1.bold = True
    run1.font.size = Pt(13)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(4)
    p_sub.paragraph_format.line_spacing = 1.15
    run2 = p_sub.add_run("HACKING WEEK — KOMPETISI LOGICODIX 2026")
    run2.bold = True
    run2.font.size = Pt(12)

    add_horizontal_divider(doc)

    # Opening
    p_open = doc.add_paragraph()
    p_open.paragraph_format.space_before = Pt(2)
    p_open.paragraph_format.space_after = Pt(6)
    p_open.paragraph_format.line_spacing = 1.15
    r_op = p_open.add_run("Yang bertanda tangan di bawah ini:")
    r_op.font.size = Pt(11.5)

    # Data Tim
    anggota_text = (
        "1. Wakhid Pangestu\n"
        "2. Rendy Setiawan\n"
        "3. Ahmad Dandi Subhani"
    )

    table_data = [
        ("Nama Ketua Tim", "Rafi Budiansyah"),
        ("Nama Tim", "unindra_coders"),
        ("Asal Instansi/Kampus", "Universitas Indraprasta PGRI"),
        ("Nama Anggota Tim", anggota_text),
        ("Judul Karya / Solusi", title_text),
        ("Tautan GitHub Publik", "https://github.com/wakhidpangestu/ZAP")
    ]

    table = doc.add_table(rows=len(table_data), cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'none')
        tblBorders.append(border)
    tblPr.append(tblBorders)

    col_widths = [Inches(1.95), Inches(0.2), Inches(4.2)]

    for row_idx, (label, val) in enumerate(table_data):
        row = table.rows[row_idx]
        
        cell_0 = row.cells[0]
        cell_0.width = col_widths[0]
        set_cell_margins(cell_0, top=25, bottom=25, left=10, right=10)
        p0 = cell_0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(1)
        p0.paragraph_format.space_after = Pt(1)
        p0.paragraph_format.line_spacing = 1.15
        r0 = p0.add_run(label)
        r0.font.size = Pt(11)

        cell_1 = row.cells[1]
        cell_1.width = col_widths[1]
        set_cell_margins(cell_1, top=25, bottom=25, left=5, right=5)
        p1 = cell_1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(1)
        p1.paragraph_format.space_after = Pt(1)
        p1.paragraph_format.line_spacing = 1.15
        r1 = p1.add_run(":")
        r1.font.size = Pt(11)

        cell_2 = row.cells[2]
        cell_2.width = col_widths[2]
        set_cell_margins(cell_2, top=25, bottom=25, left=10, right=10)
        lines = val.split('\n')
        for i, line in enumerate(lines):
            if i == 0:
                p2 = cell_2.paragraphs[0]
            else:
                p2 = cell_2.add_paragraph()
            p2.paragraph_format.space_before = Pt(1)
            p2.paragraph_format.space_after = Pt(1)
            p2.paragraph_format.line_spacing = 1.15
            r2 = p2.add_run(line)
            r2.font.size = Pt(11)
            if label == "Nama Ketua Tim" or label == "Judul Karya / Solusi":
                r2.bold = True

    # Statement opening
    p_stmt = doc.add_paragraph()
    p_stmt.paragraph_format.space_before = Pt(9)
    p_stmt.paragraph_format.space_after = Pt(4)
    p_stmt.paragraph_format.line_spacing = 1.15
    r_st = p_stmt.add_run("Dengan ini menyatakan dengan sesungguhnya dan berani bersumpah bahwa:")
    r_st.font.size = Pt(11.5)

    # 5 points
    points = [
        ("1.", "Karya dan kode sumber yang diajukan pada LOGICODIX 2026 merupakan karya orisinal tim kami, bukan hasil plagiarisme atau jiplakan karya orang lain."),
        ("2.", "Karya ini belum pernah memenangkan kompetisi sejenis di tingkat regional, nasional, maupun internasional sebelumnya."),
        ("3.", "Repositori GitHub telah bersifat PUBLIK dan dapat dijalankan secara fungsional di lingkungan localhost laptop tim saat proses verifikasi & uji coba."),
        ("4.", "Tim kami berkomitmen mematuhi Perjanjian Hacking Week untuk TIDAK melakukan update atau push commit kode baru setelah batas waktu pengumpulan."),
        ("5.", "Apabila di kemudian hari terbukti melanggar butir-butir pernyataan di atas, tim kami bersedia menerima sanksi berupa DISKUALIFIKASI dan pencabutan hak kepesertaan/kejuaraan.")
    ]

    for num, text in points:
        p_pt = doc.add_paragraph()
        p_pt.paragraph_format.left_indent = Inches(0.28)
        p_pt.paragraph_format.first_line_indent = Inches(-0.28)
        p_pt.paragraph_format.space_before = Pt(2)
        p_pt.paragraph_format.space_after = Pt(3)
        p_pt.paragraph_format.line_spacing = 1.15
        p_pt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        r_num = p_pt.add_run(f"{num} ")
        r_num.font.size = Pt(11)
        r_txt = p_pt.add_run(text)
        r_txt.font.size = Pt(11)

    # Signature
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = False

    sig_tblPr = sig_table._tbl.tblPr
    sig_tblBorders = OxmlElement('w:tblBorders')
    for b_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        b = OxmlElement(f'w:{b_name}')
        b.set(qn('w:val'), 'none')
        sig_tblBorders.append(b)
    sig_tblPr.append(sig_tblBorders)

    c_left = sig_table.rows[0].cells[0]
    c_left.width = Inches(3.0)

    c_right = sig_table.rows[0].cells[1]
    c_right.width = Inches(3.3)
    
    p_date = c_right.paragraphs[0]
    p_date.paragraph_format.space_before = Pt(6)
    p_date.paragraph_format.space_after = Pt(2)
    p_date.paragraph_format.line_spacing = 1.15
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_d = p_date.add_run("Surabaya / ...................., .................... 2026")
    r_d.font.size = Pt(11)

    p_role = c_right.add_paragraph()
    p_role.paragraph_format.space_before = Pt(3)
    p_role.paragraph_format.space_after = Pt(68)
    p_role.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ro = p_role.add_run("Ketua Tim,")
    r_ro.font.size = Pt(11)

    p_sig = c_right.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(0)
    p_sig.paragraph_format.space_after = Pt(2)
    p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s = p_sig.add_run("(   Rafi Budiansyah   )")
    r_s.bold = True
    r_s.underline = True
    r_s.font.size = Pt(11)

    p_post = c_right.add_paragraph()
    p_post.paragraph_format.space_before = Pt(0)
    p_post.paragraph_format.space_after = Pt(0)
    p_post.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_po = p_post.add_run("Ketua Tim unindra_coders")
    r_po.font.size = Pt(10.5)

    doc.save(output_docx)
    print(f"Created: {output_docx}")

def convert_to_pdf_and_preview(docx_path, pdf_path, preview_png):
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    doc = word.Documents.Open(os.path.abspath(docx_path))
    pages = doc.ComputeStatistics(2)
    print(f"{docx_path} -> Pages: {pages}")
    doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
    doc.Close()
    word.Quit()
    
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[0]
    img = page.render(scale=2).to_pil()
    img.save(preview_png)
    print(f"Rendered: {preview_png}")

if __name__ == '__main__':
    # Recommended catchy, modern, and simple title
    title = "ZAP: Smart 3D Canvas & Socratic Math Playground"
    doc_path = "Surat_Pernyataan_Orisinalitas_unindra_coders.docx"
    pdf_path = "Surat_Pernyataan_Orisinalitas_unindra_coders.pdf"
    preview_path = "Surat_Pernyataan_Preview.png"

    build_doc(doc_path, title)
    convert_to_pdf_and_preview(doc_path, pdf_path, preview_path)
