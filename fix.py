import re

with open('/Users/armand/Documents/THESIS/thesis_KABK/Thesis_WEBSITE/website_thesis_try_4/index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

captions = {}
matches = re.finditer(r'<figcaption[^>]*data-i18n="caption-(\d+)"[^>]*>(.*?)</figcaption>', html_content, flags=re.DOTALL)
for m in matches:
    num = m.group(1)
    text = m.group(2).strip().replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text)
    captions[num] = text

keys = []
for i in range(1, 60):
    val = captions.get(str(i), '')
    val = val.replace('`', '')
    keys.append(f"    'caption-{i}': null, /* {val} */")

insertion = '\n    /* Image Captions */\n' + '\n'.join(keys) + '\n\n  }\n};\n'

with open('/Users/armand/Documents/THESIS/thesis_KABK/Thesis_WEBSITE/website_thesis_try_4/assets/js/translations.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

new_js = re.sub(r'\n\s*}\n};\n*$', insertion, js_content)

with open('/Users/armand/Documents/THESIS/thesis_KABK/Thesis_WEBSITE/website_thesis_try_4/assets/js/translations.js', 'w', encoding='utf-8') as f:
    f.write(new_js)

print('Done')
