import asyncio
import uuid
from app.worker import process_scan
from app.models import ScanResult
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal

async def main():
    task_id = str(uuid.uuid4())
    print("Testing with invalid repo...")
    await process_scan("https://github.com/rishabh98080/non_existent_repo_12345", task_id)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ScanResult).where(ScanResult.task_id == task_id))
        scan = result.scalars().first()
        if scan:
            print("DB MESSAGE:", scan.message)

if __name__ == "__main__":
    asyncio.run(main())
