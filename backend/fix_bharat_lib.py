
import os

path = "/Users/maruthi/Library/Python/3.9/lib/python/site-packages/Fundamentals/Screener.py"

try:
    with open(path, 'r') as f:
        content = f.read()
    
    # The problematic string section is: .replace('\n', ' ') inside an f-string
    # We will simply remove it to allow the code to parse.
    # It seems to be part of an error message string generation, so removing the newline replacement is safe enough or we can replace it with something safe.
    
    # Target: {error.text.strip().replace('\n', ' ')}
    # We will change it to: {error.text.strip()}
    
    if ".replace('\\n', ' ')" in content:
        new_content = content.replace(".replace('\\n', ' ')", "")
        with open(path, 'w') as f:
            f.write(new_content)
        print("Successfully patched Screener.py")
    else:
        print("Target string not found, maybe already patched or different formatting.")
        
except Exception as e:
    print(f"Error patching file: {e}")
