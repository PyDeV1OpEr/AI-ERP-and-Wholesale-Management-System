"""
Single-command local launcher for RIBBON LINE.

Starts:
- FastAPI backend (`backend/run.py`)
- Next.js frontend (`npm run dev` in frontend/)
"""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000")


def launch_process(command: list[str], cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(command, cwd=str(cwd))


def terminate_process(proc: subprocess.Popen | None) -> None:
    if proc is None or proc.poll() is not None:
        return
    proc.send_signal(signal.SIGINT)
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def main() -> int:
    print("Starting RIBBON LINE...")
    print(f"Backend  : http://{BACKEND_HOST}:{BACKEND_PORT}")
    print(f"Frontend : http://127.0.0.1:{FRONTEND_PORT}")
    print("-" * 56)

    backend_proc: subprocess.Popen | None = None
    frontend_proc: subprocess.Popen | None = None

    try:
        backend_proc = launch_process([sys.executable, "run.py"], BACKEND_DIR)
        frontend_proc = launch_process(["npm", "run", "dev"], FRONTEND_DIR)

        while True:
            if backend_proc.poll() is not None:
                print("Backend process exited unexpectedly.")
                return 1
            if frontend_proc.poll() is not None:
                print("Frontend process exited unexpectedly.")
                return 1
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down RIBBON LINE...")
        return 0
    finally:
        terminate_process(frontend_proc)
        terminate_process(backend_proc)


if __name__ == "__main__":
    raise SystemExit(main())
