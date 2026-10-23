"""Latest trends: newest official readings for inflation, unemployment, policy rate, GDP growth.
Sources (all free, keyless): BIS (policy rates WS_CBPOL, CPI y/y WS_LONG_CPI), FRED public CSV (US),
World Bank WDI (annual fallback, from src/data/wb.json). Writes src/data/latest.json. No invented values."""
import csv, io, json, urllib.request, datetime, pathlib, time
ROOT = pathlib.Path(__file__).resolve().parent.parent
WB = json.loads((ROOT / "src/data/wb.json").read_text())
C = {"india": "IN", "usa": "US", "china": "CN", "uk": "GB", "germany": "DE", "japan": "JP", "brazil": "BR", "indonesia": "ID", "nigeria": "NG", "uae": "AE"}
def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "GovPulse/1.0 (+https://govpulse.pages.dev)"}), timeout=60) as r: return r.read().decode()
        except Exception as e: err = e; time.sleep(2 * (i + 1))
    raise err
def bis(flow, key, start):
    out = {}
    try: rows = list(csv.DictReader(io.StringIO(get(f"https://stats.bis.org/api/v1/data/{flow}/{key}/all?startPeriod={start}&format=csv"))))
    except Exception as e: print("BIS fail", flow, e); return out
    for r in rows:
        if r.get("OBS_VALUE") in (None, "", "NaN"): continue
        out.setdefault(r["REF_AREA"], []).append((r["TIME_PERIOD"], float(r["OBS_VALUE"])))
    for k in out: out[k].sort()
    return out
def fred(sid, start="2023-01-01", q=False):
    try: rows = list(csv.reader(io.StringIO(get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd={start}"))))[1:]
    except Exception as e: print("FRED fail", sid, e); return []
    return [((f"{d[:4]}-Q{(int(d[5:7])-1)//3+1}" if q else d[:7]), float(v)) for d, v in rows if v not in ("", ".")]
start = (datetime.date.today() - datetime.timedelta(days=800)).strftime("%Y-%m")
areas = "+".join(set(C.values()) | {"XM"})
pol = bis("WS_CBPOL", f"M.{areas}", start); cpi = bis("WS_LONG_CPI", f"M.{areas}.771", start)
def mk(series, src, url, freq):
    if len(series) < 2: return None
    (d1, v1), (d0, v0) = series[-1], series[-2]
    return {"value": round(v1, 3), "period": d1, "prev": round(v0, 3), "prevPeriod": d0, "change": round(v1 - v0, 3), "source": src, "url": url, "freq": freq, "spark": [[d, round(v, 3)] for d, v in series[-24:]]}
def wb(c, code):
    s = WB["countries"][c].get(code, [])
    return mk([(str(y), v) for y, v in s], f"World Bank WDI {code}", f"https://data.worldbank.org/indicator/{code}", "annual")
out = {"generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "countries": {}}
for c, iso in C.items():
    r = {}
    r["inflation"] = mk(cpi.get(iso, []), "BIS consumer prices (y/y %)", "https://data.bis.org/topics/CPI", "monthly") or wb(c, "FP.CPI.TOTL.ZG")
    pa = "XM" if iso == "DE" else iso
    r["policyRate"] = mk(pol.get(pa, []), "BIS central bank policy rates" + (" (ECB, euro area)" if pa == "XM" else ""), "https://data.bis.org/topics/CBPOL", "monthly") or wb(c, "FR.INR.LEND")
    if r["policyRate"] and r["policyRate"]["source"].startswith("World Bank"): r["policyRate"]["note"] = "Lending rate (no policy-rate series available)"
    r["unemployment"] = wb(c, "SL.UEM.TOTL.ZS"); r["gdpGrowth"] = wb(c, "NY.GDP.MKTP.KD.ZG")
    if c == "usa":
        u = fred("UNRATE"); g = fred("A191RL1Q225SBEA", "2022-01-01", True)
        r["unemployment"] = mk(u, "FRED UNRATE (BLS)", "https://fred.stlouisfed.org/series/UNRATE", "monthly") or r["unemployment"]
        r["gdpGrowth"] = mk(g, "FRED A191RL1Q225SBEA (BEA, real GDP q/q annualised)", "https://fred.stlouisfed.org/series/A191RL1Q225SBEA", "quarterly") or r["gdpGrowth"]
    out["countries"][c] = r
(ROOT / "src/data/latest.json").write_text(json.dumps(out))
print("latest ok", {c: [k for k, v in r.items() if v and v["freq"] != "annual"] for c, r in out["countries"].items()})
