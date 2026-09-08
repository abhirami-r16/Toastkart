import re

with open('d:/shopify/Aug19/latest_code/frontend/src/pages/store-owner-dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<div className=\"mb-2\">\s*<label\s*className=\"position-relative d-inline-flex flex-column align-items-center justify-content-center cursor-pointer mb-0\"\s*style=\{\{ width: 96, height: 96, background: \"#f9fafb\", border: \"2px dashed #dfe3e8\", borderRadius: \"8px\", transition: \"background 0.2s\" \}\}\s*onMouseEnter=\{\(e\) => e\.currentTarget\.style\.background = \"#f1f2f4\"\}\s*onMouseLeave=\{\(e\) => e\.currentTarget\.style\.background = \"#f9fafb\"\}\s*>\s*<Plus size=\{24\} style=\{\{ color: \"#007f5f\" \}\} />\s*<span className=\"fs-9 mt-1 fw-semibold\" style=\{\{ color: \"#007f5f\" \}\}>Add Image</span>'

replacement = '''<div className=\"mb-3\">
                  <label 
                    className=\"position-relative d-flex flex-column align-items-center justify-content-center cursor-pointer w-100\" 
                    style={{ height: 120, background: \"#f8f9fa\", border: \"2px dashed #007f5f\", borderRadius: \"12px\", transition: \"all 0.2s\" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = \"#e6f4ea\"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = \"#f8f9fa\"; }}
                  >
                    <div className=\"d-flex align-items-center justify-content-center mb-2\" style={{ width: 40, height: 40, borderRadius: \"50%\", background: \"#e6f4ea\" }}>
                      <Plus size={24} style={{ color: \"#007f5f\" }} />
                    </div>
                    <span className=\"fs-8 fw-semibold\" style={{ color: \"#007f5f\" }}>Click here to upload images</span>
                    <span className=\"fs-9 mt-1\" style={{ color: \"#6c757d\" }}>Supports JPG, PNG, WEBP files</span>'''

new_content = re.sub(pattern, replacement, content)

if new_content == content:
    print('NO CHANGES MADE')
else:
    with open('d:/shopify/Aug19/latest_code/frontend/src/pages/store-owner-dashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS')
