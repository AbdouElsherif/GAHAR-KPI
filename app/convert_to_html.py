import re
from pathlib import Path

# قراءة محتوى الدليل الشامل
md_file = Path(r'C:\Users\Sara\.gemini\antigravity\brain\d7014110-b02b-4982-b727-cb02e16387e5\دليل_استضافة_التطبيق_الشامل.md')
content = md_file.read_text(encoding='utf-8')

# تحويل بسيط من Markdown إلى HTML
html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دليل استضافة تطبيق GAHAR KPI الشامل</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
            color: #333;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #1a73e8;
            border-bottom: 3px solid #1a73e8;
            padding-bottom: 10px;
            margin-bottom: 30px;
            font-size: 2.2em;
        }}
        h2 {{
            color: #e37400;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-right: 5px solid #e37400;
            padding-right: 15px;
        }}
        h3 {{
            color: #2d5a2d;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.4em;
        }}
        h4 {{
            color: #555;
            margin-top: 20px;
            font-size: 1.2em;
        }}
        p {{
            margin: 15px 0;
            text-align: justify;
        }}
        ul, ol {{
            margin: 15px 0;
            padding-right: 30px;
        }}
        li {{
            margin: 8px 0;
        }}
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #c7254e;
            font-size: 0.9em;
        }}
        pre {{
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 20px 0;
            direction: ltr;
            text-align: left;
        }}
        pre code {{
            background: transparent;
            color: #f8f8f2;
            padding: 0;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            direction: rtl;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
        }}
        th {{
            background-color: #1a73e8;
            color: white;
            font-weight: bold;
        }}
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        blockquote {{
            border-right: 4px solid #1a73e8;
            margin: 20px 0;
            padding: 15px 20px;
            background: #f0f7ff;
            font-style: italic;
        }}
        .warning {{
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 15px 20px;
            margin: 20px 0;
        }}
        .success {{
            background: #d4edda;
            border-right: 4px solid #28a745;
            padding: 15px 20px;
            margin: 20px 0;
        }}
        .info {{
            background: #d1ecf1;
            border-right: 4px solid #17a2b8;
            padding: 15px 20px;
            margin: 20px 0;
        }}
        hr {{
            border: none;
            border-top: 2px solid #e0e0e0;
            margin: 40px 0;
        }}
        .page-break {{
            page-break-after: always;
        }}
        @media print {{
            body {{
                background: white;
            }}
            .container {{
                box-shadow: none;
            }}
        }}
    </style>
</head>
<body>
<div class="container">
"""

# تحويل Markdown إلى HTML
lines = content.split('\n')
in_code_block = False
code_language = ''
in_table = False

for line in lines:
    # Code blocks
    if line.startswith('```'):
        if not in_code_block:
            code_language = line.replace('```', '').strip()
            html_content += '<pre><code>'
            in_code_block = True
        else:
            html_content += '</code></pre>\n'
            in_code_block = False
        continue
    
    if in_code_block:
        html_content += line.replace('<', '&lt;').replace('>', '&gt;') + '\n'
        continue
    
    # Headers
    if line.startswith('# '):
        html_content += f'<h1>{line[2:]}</h1>\n'
    elif line.startswith('## '):
        html_content += f'<h2>{line[3:]}</h2>\n'
    elif line.startswith('### '):
        html_content += f'<h3>{line[4:]}</h3>\n'
    elif line.startswith('#### '):
        html_content += f'<h4>{line[5:]}</h4>\n'
    
    # Horizontal rule
    elif line.strip() == '---':
        html_content += '<hr>\n'
    
    # Blockquote (warnings/notes)
    elif line.startswith('> '):
        quote_text = line[2:]
        if '⚠️' in quote_text or 'تحذير' in quote_text or 'WARNING' in quote_text.upper():
            html_content += f'<div class="warning">{quote_text}</div>\n'
        elif '✅' in quote_text or 'ملاحظة' in quote_text:
            html_content += f'<div class="success">{quote_text}</div>\n'
        else:
            html_content += f'<div class="info">{quote_text}</div>\n'
    
    # Table
    elif '|' in line and line.strip().startswith('|'):
        if not in_table:
            html_content += '<table>\n'
            in_table = True
        
        # Check if it's a separator row
        if set(line.replace('|', '').replace('-', '').strip()) == set():
            continue
        
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        
        # Detect if this is a header row (usually the first row)
        if in_table and '<tr>' not in html_content.split('<table>')[-1]:
            html_content += '<tr>'
            for cell in cells:
                html_content += f'<th>{cell}</th>'
            html_content += '</tr>\n'
        else:
            html_content += '<tr>'
            for cell in cells:
                html_content += f'<td>{cell}</td>'
            html_content += '</tr>\n'
    else:
        if in_table and '|' not in line:
            html_content += '</table>\n'
            in_table = False
        
        # Lists
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            item_text = line.strip()[2:]
            # Convert inline code
            item_text = re.sub(r'`([^`]+)`', r'<code>\1</code>', item_text)
            # Convert bold
            item_text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', item_text)
            html_content += f'<li>{item_text}</li>\n'
        elif re.match(r'^\d+\.', line.strip()):
            item_text = re.sub(r'^\d+\.\s*', '', line.strip())
            item_text = re.sub(r'`([^`]+)`', r'<code>\1</code>', item_text)
            item_text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', item_text)
            html_content += f'<li>{item_text}</li>\n'
        # Regular paragraph
        elif line.strip():
            p_text = line
            # Convert inline code
            p_text = re.sub(r'`([^`]+)`', r'<code>\1</code>', p_text)
            # Convert bold
            p_text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', p_text)
            # Convert links
            p_text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', p_text)
            html_content += f'<p>{p_text}</p>\n'
        else:
            html_content += '<br>\n'

html_content += """
</div>
</body>
</html>
"""

# حفظ ملف HTML
output_file = Path(r'C:\Users\Sara\.gemini\antigravity\brain\d7014110-b02b-4982-b727-cb02e16387e5\دليل_الاستضافة_الشامل.html')
output_file.write_text(html_content, encoding='utf-8')

print(f"✅ تم إنشاء الملف: {output_file}")
print("\n📝 يمكنك الآن:")
print("1. فتح الملف بالمتصفح ثم حفظه كـ PDF")
print("2. فتح الملف بـ Microsoft Word ثم حفظه بصيغة .docx")
print("3. فتح الملف بـ Google Docs ثم تصديره كـ Word")
