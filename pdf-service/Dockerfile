FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required by paddlepaddle
RUN apt-get update && apt-get install -y \
    libgomp1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose port
EXPOSE 5001

# Run the application
CMD ["python", "app.py"]
