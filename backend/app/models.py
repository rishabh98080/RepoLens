from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    name = Column(String)
    
    scans = relationship("ScanResult", back_populates="repository")

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    status = Column(String) # e.g., 'running', 'completed', 'error'
    risk_score = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    repository = relationship("Repository", back_populates="scans")
    findings = relationship("Finding", back_populates="scan")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scan_results.id"))
    scanner_type = Column(String) # 'gitleaks', 'semgrep', etc.
    severity = Column(String)
    file_path = Column(String)
    line_number = Column(Integer, nullable=True)
    description = Column(Text)
    raw_output = Column(Text) # Fallback for unparsed raw JSON output
    
    scan = relationship("ScanResult", back_populates="findings")
