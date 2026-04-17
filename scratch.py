import re
import sys

def print_conflicts(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    conflicts = re.findall(r'(<<<<<<< HEAD\n.*?\n=======\n.*?\n>>>>>>> [^\n]*\n)', content, re.DOTALL)
    print(f"Conflicts in {filename}: {len(conflicts)}")
    for i, conflict in enumerate(conflicts):
        print(f"--- Conflict {i+1} ---")
        print(conflict)

for f in ["app/dashboard/runs/scheduled/new/page.tsx", "app/dashboard/runs/[id]/report/page.tsx", "app/dashboard/runs/new/page.tsx", "app/dashboard/wallet/page.tsx"]:
    try:
        print_conflicts(f)
    except:
        pass
