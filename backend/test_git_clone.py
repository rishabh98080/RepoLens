import subprocess
import os

env = os.environ.copy()
env["GIT_TERMINAL_PROMPT"] = "0"
try:
    res = subprocess.run(["git", "clone", "https://github.com/rishabh98080/AppImage-Manager-for-Ubuntu-Linux", "/tmp/test_clone_script"], check=True, capture_output=True, env=env, stdin=subprocess.DEVNULL, timeout=300)
    print("SUCCESS")
except subprocess.CalledProcessError as e:
    print("FAILED with code", e.returncode)
    print("STDOUT:", repr(e.stdout))
    print("STDERR:", repr(e.stderr))
