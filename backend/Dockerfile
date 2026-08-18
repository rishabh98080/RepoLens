FROM python:3.11-slim

# Install git, wget, and other system dependencies
RUN apt-get update && apt-get install -y git wget tar && rm -rf /var/lib/apt/lists/*

# Install Gitleaks
RUN wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz && \
    tar -xzf gitleaks_8.18.1_linux_x64.tar.gz && \
    mv gitleaks /usr/local/bin/ && \
    rm gitleaks_8.18.1_linux_x64.tar.gz

# Install Trivy
RUN wget https://github.com/aquasecurity/trivy/releases/download/v0.74.0/trivy_0.74.0_Linux-64bit.tar.gz && \
    tar -xzf trivy_0.74.0_Linux-64bit.tar.gz trivy && \
    mv trivy /usr/local/bin/ && \
    rm trivy_0.74.0_Linux-64bit.tar.gz

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
# Add semgrep to requirements for the worker
RUN pip install --no-cache-dir -r requirements.txt semgrep

COPY . .

# Add /app to PYTHONPATH
ENV PYTHONPATH=/app

# Run the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
