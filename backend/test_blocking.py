from app.worker import run_blocking_scan
import uuid

task_id = str(uuid.uuid4())
res = run_blocking_scan("https://github.com/rishabh98080/Cortex_Chat_Assisstant", task_id)
print("RESULT:", res)
