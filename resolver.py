import re
import glob

def resolve_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    def replacer(match):
        head_content = match.group(1)
        theirs_content = match.group(2)
        
        # Exception 1: wallet/page.tsx state declarations
        if 'const { data: wallet' in head_content:
            return head_content
            
        # Exception 2: layout.tsx if any
        if 'SidebarInset' in head_content and 'SidebarInset' not in theirs_content:
            return head_content
            
        # Default: take ui-update (theirs)
        return theirs_content

    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [^\n]*\n', re.DOTALL)
    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Resolved {filepath}")

for f in glob.glob('**/*.tsx', recursive=True):
    resolve_file(f)
