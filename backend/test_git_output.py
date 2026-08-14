import subprocess
try:
    subprocess.run(["git", "clone", "https://github.com/rishabh98080/non_existent_repo", "/tmp/dummy"], check=True, capture_output=True)
except subprocess.CalledProcessError as e:
    print("STDOUT:", repr(e.stdout))
    print("STDERR:", repr(e.stderr))
