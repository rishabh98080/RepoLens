import asyncio
from app.worker import process_scan
import uuid

async def main():
    task_id = str(uuid.uuid4())
    print("Starting...")
    await process_scan("https://github.com/rishabh98080/Cortex_Chat_Assisstant", task_id)
    print("Finished.")

if __name__ == "__main__":
    asyncio.run(main())
