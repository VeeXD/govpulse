"""GovPulse data pipeline: pulls REAL indicators from the World Bank API (CC BY 4.0).
Writes src/data/wb.json (and data.parquet if pyarrow is installed). No fabricated values."""
import json, urllib.request, datetime, pathlib, time
COUNTRIES = {"IND":"india","USA":"usa","CHN":"china","GBR":"uk","DEU":"germany","JPN":"japan","BRA":"brazil","IDN":"indonesia","NGA":"nigeria","ARE":"uae"}
IND = {  # code: (label, unit, industry, higher_is_good)
 "NY.GDP.MKTP.KD.ZG":("GDP growth","%","overview",True),
 "FP.CPI.TOTL.ZG":("Inflation (CPI)","%","overview",False),
 "SL.UEM.TOTL.ZS":("Unemployment","% labour force","overview",False),
 "NY.GDP.PCAP.CD":("GDP per capita","US$","overview",True),
 "GC.DOD.TOTL.GD.ZS":("Central govt debt","% GDP","overview",False),
 "BN.CAB.XOKA.GD.ZS":("Current account","% GDP","overview",True),
 "NE.GDI.TOTL.ZS":("Investment (gross capital formation)","% GDP","overview",True),
 "NV.AGR.TOTL.ZS":("Agriculture value added","% GDP","agriculture",None),
 "SP.RUR.TOTL.ZS":("Rural population","% population","agriculture",None),
 "SL.AGR.EMPL.ZS":("Employment in agriculture","% employment",'agriculture',None),
 "AG.YLD.CREL.KG":("Cereal yield","kg/ha","agriculture",True),
 "AG.LND.ARBL.ZS":("Arable land","% land","agriculture",None),
 "SH.XPD.CHEX.GD.ZS":("Health expenditure","% GDP","healthcare",None),
 "SP.DYN.LE00.IN":("Life expectancy","years","other",True),
 "SP.DYN.IMRT.IN":("Infant mortality","per 1,000 births","healthcare",False),
 "SH.MED.PHYS.ZS":("Physicians","per 1,000 people","healthcare",True),
 "FR.INR.LEND":("Lending interest rate","%","finance",None),
 "FS.AST.PRVT.GD.ZS":("Private credit","% GDP","finance",None),
 "CM.MKT.LCAP.GD.ZS":("Stock market cap","% GDP","finance",None),
 "PA.NUS.FCRF":("Exchange rate","LCU per US$","finance",None),
 "EG.FEC.RNEW.ZS":("Renewable energy share","% final energy","energy",True),
 "EG.ELC.ACCS.ZS":("Access to electricity","% population","energy",True),
 "EG.USE.PCAP.KG.OE":("Energy use per capita","kg oil eq.","energy",None),
 "NV.IND.MANF.ZS":("Manufacturing value added","% GDP","manufacturing",None),
 "NV.IND.TOTL.ZS":("Industry value added","% GDP","manufacturing",None),
 "NE.EXP.GNFS.ZS":("Exports","% GDP","trade",None),
 "NE.IMP.GNFS.ZS":("Imports","% GDP","trade",None),
 "TX.VAL.TECH.MF.ZS":("High-tech exports","% manuf. exports","manufacturing",True),
 "TX.VAL.MRCH.CD.WT":("Merchandise exports","US$","trade",None),
 "TM.VAL.MRCH.CD.WT":("Merchandise imports","US$","trade",None),
 "TM.VAL.FUEL.ZS.UN":("Fuel imports","% merch. imports","trade",None),
 "TM.VAL.FOOD.ZS.UN":("Food imports","% merch. imports","trade",None),
 "TM.VAL.AGRI.ZS.UN":("Agricultural raw material imports","% merch. imports","trade",None),
 "TM.VAL.MMTL.ZS.UN":("Ores & metals imports","% merch. imports","trade",None),
 "TM.VAL.MANF.ZS.UN":("Manufactures imports","% merch. imports","trade",None),
 "TX.VAL.FUEL.ZS.UN":("Fuel exports","% merch. exports","trade",None),
 "TX.VAL.MANF.ZS.UN":("Manufactures exports","% merch. exports","trade",None),
 "TX.VAL.FOOD.ZS.UN":("Food exports","% merch. exports","trade",None),
 "IT.NET.USER.ZS":("Internet users","% population","it",True),
 "IT.CEL.SETS.P2":("Mobile subscriptions","per 100 people","it",None),
 "IT.NET.BBND.P2":("Fixed broadband","per 100 people","it",True),
 "BX.GSR.CCIS.ZS":("ICT service exports","% service exports","it",None),
 "NV.IND.MANF.CD":("Manufacturing output","US$","manufacturing",True),
 "EG.ELC.RNEW.ZS":("Renewable electricity","% electricity output","energy",True),
 "EG.IMP.CONS.ZS":("Net energy imports","% energy use","energy",None),
 "ST.INT.ARVL":("Tourist arrivals","arrivals","other",None),
 "ST.INT.RCPT.CD":("Tourism receipts","US$","other",None),
 "SP.POP.TOTL":("Population","people","other",None),
 "SP.URB.TOTL.IN.ZS":("Urban population","% population","other",None),
}
def get(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r: return json.load(r)
        except Exception as e: err=e; time.sleep(2*(i+1))
    raise err
out = {"generated": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "source":"World Bank World Development Indicators (CC BY 4.0)", "indicators":{}, "countries":{v:{} for v in COUNTRIES.values()}}
rows=[]
for code,(label,unit,ind,good) in IND.items():
    url=f"https://api.worldbank.org/v2/country/{';'.join(COUNTRIES)}/indicator/{code}?format=json&date=2000:2025&per_page=2000"
    try: data=get(url)
    except Exception as e: print("FAIL",code,e); continue
    meta, recs = data[0], (data[1] or [])
    out["indicators"][code]={"label":label,"unit":unit,"industry":ind,"good":good,"wb_updated":meta.get("lastupdated"),"url":f"https://data.worldbank.org/indicator/{code}"}
    for r in recs:
        if r["value"] is None: continue
        c=COUNTRIES.get(r["countryiso3code"]); 
        if not c: continue
        out["countries"][c].setdefault(code,[]).append([int(r["date"]),round(r["value"],3)])
        rows.append({"country":c,"indicator":code,"year":int(r["date"]),"value":r["value"]})
    print("ok",code,len(recs))
for c in out["countries"].values():
    for k in c: c[k].sort()
p=pathlib.Path(__file__).resolve().parent.parent/"src/data"; p.mkdir(parents=True,exist_ok=True)
(p/"wb.json").write_text(json.dumps(out))
try:
    import pyarrow as pa, pyarrow.parquet as pq
    pq.write_table(pa.Table.from_pylist(rows), p.parent.parent/"pipeline/data.parquet")
except ImportError: print("pyarrow not installed; skipped parquet")
print("rows",len(rows))
