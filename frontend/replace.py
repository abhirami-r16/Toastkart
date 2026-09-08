import re

with open('d:/shopify/Aug19/latest_code/frontend/src/pages/store-owner-dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<input\s+type=\"file\"\s+multiple\s+accept=\"image/\*\"\s+onChange=\{async \(e\) => \{[\s\S]*?\}\}\s+className=\"form-control\"\s+style=\{\{\s*border:\s*\"1px solid #dfe3e8\",\s*color:\s*\"#202223\",\s*backgroundColor:\s*\"#fafbfc\"\s*\}\}\s*/>'

replacement = '''<div className=\"mb-2\">
                  <label 
                    className=\"position-relative d-inline-flex flex-column align-items-center justify-content-center cursor-pointer mb-0\" 
                    style={{ width: 96, height: 96, background: \"#f9fafb\", border: \"2px dashed #dfe3e8\", borderRadius: \"8px\", transition: \"background 0.2s\" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = \"#f1f2f4\"}
                    onMouseLeave={(e) => e.currentTarget.style.background = \"#f9fafb\"}
                  >
                    <Plus size={24} style={{ color: \"#007f5f\" }} />
                    <span className=\"fs-9 mt-1 fw-semibold\" style={{ color: \"#007f5f\" }}>Add Image</span>
                    <input
                      type=\"file\"
                      multiple
                      accept=\"image/*\"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        const readers = files.map(file => new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(file);
                        }));
                        const results = await Promise.all(readers);
                        const currentImages = newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : []);
                        const newImages = [...currentImages, ...results.map(url => ({ url, color: '' }))];
                        setNewProd({ ...newProd, images: newImages, image: newImages[0]?.url || '' });
                        e.target.value = null;
                      }}
                      className=\"d-none\"
                    />
                  </label>
                </div>'''

new_content = re.sub(pattern, replacement, content)

if new_content == content:
    print('NO CHANGES MADE')
else:
    with open('d:/shopify/Aug19/latest_code/frontend/src/pages/store-owner-dashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS')
