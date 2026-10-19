"""Export src/data/wb.json to datasets/govpulse_indicators.csv (long format) for Kaggle / Hugging Face."""
import json, csv
d = json.load(open('src/data/wb.json')); I = d['indicators']
with open('datasets/govpulse_indicators.csv', 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['country', 'indicator_code', 'indicator', 'industry', 'unit', 'year', 'value'])
    for c, ser in d['countries'].items():
        for code, s in ser.items():
            for y, v in s:
                if v is not None: w.writerow([c, code, I[code]['label'], I[code].get('industry', ''), I[code].get('unit', ''), int(y), v])
