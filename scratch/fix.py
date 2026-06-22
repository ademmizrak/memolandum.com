with open('D:/000Memorade/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[1464:1474] = [
    '      const rawCats = getCategories(langPair);\n',
    '      const levels = [\n',
    '        ...(rawCats.core || []),\n',
    '        ...(rawCats.sentences || []),\n',
    '        ...(rawCats.special || []),\n',
    '        ...(rawCats.yksHazirlik || []),\n',
    '        ...(rawCats.ydsKelimeleri || [])\n',
    '      ];\n'
]

with open('D:/000Memorade/index.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)
