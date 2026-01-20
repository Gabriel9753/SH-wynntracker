FROM python:3.12-slim
WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src/ ./src/
RUN mkdir -p /data
ENV OUTPUT_DIR=/data
CMD ["uv", "run", "src/main.py"]
