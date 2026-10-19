---
license: cc-by-4.0
pretty_name: GovPulse Economic Indicators by Country and Industry
tags: [economics, open-data, gdp, world-bank, government-analytics, time-series]
task_categories: [time-series-forecasting, tabular-regression]
size_categories: [1K<n<10K]
configs:
- config_name: default
  data_files: govpulse_indicators.csv
---
# GovPulse economic indicators (World Bank WDI, cleaned)

28 World Bank World Development Indicators for 10 major economies (India, USA, China, Germany, Japan, UK, Brazil, Indonesia, Nigeria, UAE), 2000 to the latest year, grouped by industry (macro, agriculture, healthcare, finance, energy, manufacturing). It is refreshed nightly and powers the free dashboard at **https://govpulse.pages.dev**.

The repo's `datasets/README.md` doubles as the dataset card: Hugging Face reads the YAML header above, and you can paste the body into Kaggle's description field.

## File
`govpulse_indicators.csv` is in long format:

| column | description |
|---|---|
| country | GovPulse country slug (e.g. `india`) |
| indicator_code | World Bank code (e.g. `NY.GDP.MKTP.KD.ZG`) |
| indicator | Human label |
| industry | overview, agriculture, healthcare, finance, energy, manufacturing |
| unit | Unit of measure |
| year | Calendar year |
| value | Value (nulls dropped) |

The same data is available as a JSON API at https://govpulse.pages.dev/api/v1/countries.json (see https://govpulse.pages.dev/api/).

## Source & licence
The data comes from the World Bank World Development Indicators (https://data.worldbank.org) under **CC BY 4.0**. GovPulse adds no modelled values. Please cite:
> World Bank, World Development Indicators, via GovPulse (https://govpulse.pages.dev).

## Update cadence
A nightly GitHub Action runs `pipeline/fetch.py` and then `pipeline/export_csv.py`. The World Bank publishes annual data with a lag of 1 to 2 years.

## Publishing (needs owner accounts)
- **Kaggle**: create a dataset at kaggle.com/datasets/new, upload the CSV and paste this card. It needs a Kaggle account.
- **Hugging Face**: create a dataset repo `govpulse/economic-indicators` and push this folder. It needs an HF account and a write token.
- **data.world**: create a dataset from this GitHub folder URL. It needs an account.
