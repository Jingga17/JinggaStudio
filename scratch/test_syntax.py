import sys
import esprima

# We don't have esprima in python, but we can just use the command line node
import subprocess
try:
    result = subprocess.run(['node', '-c', 'c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\admin.js'], capture_output=True, text=True, check=True)
    with open("syntax_result.txt", "w") as f:
        f.write("OK: " + result.stdout)
except subprocess.CalledProcessError as e:
    with open("syntax_result.txt", "w") as f:
        f.write("ERROR: " + e.stderr)
