"""Aggregate Eastern LM (WooCommerce) delivery orders by delivery zone / ring.

Usage: python scripts/analysis/elm_delivery_geo.py <All_WC_Orders_Export.csv>
Outputs aggregates only (no customer PII). Source export lives in the easternLM project.
"""
import csv, re, sys, collections, statistics

RINGS = {  # ELM zone label keyword -> ring (drive distance from Center Moriches yard)
    'core': ['manorville', 'center moriches', 'east moriches', 'moriches', 'mastic', 'shirley', 'eastport', 'localship20', 'localship25', 'localship35'],
    'west_hamptons': ['remsenburg', 'speonk', 'westhampton', 'quogue', 'quiogue', 'dune road', 'east quogue', 'localship50'],
    'brookhaven_mid': ['patchogue', 'bellport', 'brookhaven', 'yaphank', 'ridge', 'medford', 'coram', 'holtsville', 'middle island', 'localship75'],
    'east_end': ['southampton', 'sag harbor', 'watermill', 'hampton bays', 'east hampton', 'bridgehampton', 'jamesport', 'mattit', 'riverhead', 'calverton', 'localship85', 'localship95', 'localship100'],
    'north_shore': ['wading river', 'shoreham', 'rocky point', 'localship125', 'localship150', 'localship200'],
}

def ring_for(label):
    l = label.lower()
    for ring, keys in RINGS.items():
        if any(k in l for k in keys):
            return ring
    return 'other'

def amount(r):
    try:
        return float(r['Amount'] or 0)
    except ValueError:
        return 0.0

def category(item):
    i = item.lower()
    if 'mulch' in i: return 'mulch'
    if any(k in i for k in ('topsoil', 'compost', 'fill', 'soil')): return 'soil'
    if 'sand' in i: return 'sand'
    if any(k in i for k in ('gravel', 'stone', 'rca', 'bluestone', 'rock', 'burgundy', 'millings')): return 'stone'
    return 'other'

def main(path):
    rows = [r for r in csv.DictReader(open(path, encoding='utf-8-sig', errors='replace'))
            if r['Status'] in ('Completed', 'Processing')]
    ring = collections.defaultdict(lambda: {'n': 0, 'rev': 0.0, 'amts': [], 'cat': collections.Counter()})
    months = collections.Counter()
    for r in rows:
        m = re.search(r'Delivery\s*-\s*([^|,]+)', r['Items'], re.I)
        if not m:
            continue
        g = ring[ring_for(m.group(1))]
        a = amount(r)
        g['n'] += 1; g['rev'] += a; g['amts'].append(a)
        months[r['Date'][5:7]] += 1
        for part in re.split(r'[|,]', r['Items']):
            if 'deliver' not in part.lower():
                g['cat'][category(part)] += 1
    total_n = sum(g['n'] for g in ring.values()); total_rev = sum(g['rev'] for g in ring.values())
    print(f'Delivered orders: {total_n}  revenue: ${total_rev:,.0f}\n')
    print('| Ring | Orders | Revenue | Share of rev | Avg | Median | Line-item mix % (mulch/soil/sand/stone/other) |')
    print('|---|---|---|---|---|---|---|')
    for name, g in sorted(ring.items(), key=lambda kv: -kv[1]['rev']):
        c = g['cat']; ct = sum(c.values()) or 1
        mix = '/'.join(f"{100*c[k]//ct}" for k in ('mulch', 'soil', 'sand', 'stone', 'other'))
        print(f"| {name} | {g['n']} | ${g['rev']:,.0f} | {100*g['rev']/total_rev:.0f}% | ${g['rev']/g['n']:,.0f} | ${statistics.median(g['amts']):,.0f} | {mix} |")
    print('\n| Month | Share of delivered orders |\n|---|---|')
    for mo in sorted(months):
        print(f'| {mo} | {100*months[mo]/total_n:.1f}% |')

if __name__ == '__main__':
    main(sys.argv[1])
