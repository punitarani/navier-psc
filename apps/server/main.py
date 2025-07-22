import sys
from pathlib import Path

# Add the current directory to the Python path so we can import psc
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    import uvicorn

    from psc.server import app

    uvicorn.run(app, host="0.0.0.0", port=8000)
