import sys

path = 'assets/js/translations.js'
content = open(path, 'r', encoding='utf-8').read()

in_backtick = False
in_single = False
in_double = False
single_start_line = 0
line_count = 1

for i, char in enumerate(content):
    if char == '\n':
        line_count += 1
        
    if not in_backtick and not in_single and not in_double:
        if char == '`': in_backtick = True
        elif char == "'": 
            in_single = True
            single_start_line = line_count
        elif char == '"': in_double = True
    else:
        if in_backtick and char == '`' and content[i-1] != '\\':
            in_backtick = False
        elif in_single and char == "'" and content[i-1] != '\\':
            in_single = False
        elif in_double and char == '"' and content[i-1] != '\\':
            in_double = False

if in_single: print(f'Unclosed single quote started at line {single_start_line}')
