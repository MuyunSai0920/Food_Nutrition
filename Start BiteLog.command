#!/bin/zsh
set -e

cd "$(dirname "$0")"

OLLAMA_BIN="/Applications/Ollama.app/Contents/Resources/ollama"
OLLAMA_URL="http://127.0.0.1:11434/api/tags"
server_pid=""
ollama_pid=""

cleanup() {
  [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null || true
  [[ -n "$ollama_pid" ]] && kill "$ollama_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js is required" message "Install the current LTS version of Node.js from nodejs.org, then run this launcher again."'
  exit 1
fi

if ! curl -fsS "$OLLAMA_URL" >/dev/null 2>&1; then
  if [[ ! -x "$OLLAMA_BIN" ]]; then
    osascript -e 'display alert "Local AI is not installed" message "Install Ollama, then run this launcher again."'
    exit 1
  fi
  echo "Opening the local AI application..."
  open -a "Ollama"
  for _ in {1..30}; do
    curl -fsS "$OLLAMA_URL" >/dev/null 2>&1 && break
    sleep 1
  done
  if ! curl -fsS "$OLLAMA_URL" >/dev/null 2>&1; then
    echo "Starting the local AI service..."
    "$OLLAMA_BIN" serve > .ollama.log 2>&1 &
    ollama_pid=$!
    for _ in {1..30}; do
      curl -fsS "$OLLAMA_URL" >/dev/null 2>&1 && break
      sleep 1
    done
  fi
  if ! curl -fsS "$OLLAMA_URL" >/dev/null 2>&1; then
    osascript -e 'display alert "Local AI could not start" message "Open Ollama and try the BiteLog launcher again."'
    exit 1
  fi
fi

if ! "$OLLAMA_BIN" list | awk 'NR > 1 { print $1 }' | grep -q '^llava:'; then
  osascript -e 'display alert "The LLaVA model is not ready" message "Wait for the local model download to finish, then run this launcher again."'
  exit 1
fi

if lsof -iTCP:3030 -sTCP:LISTEN -t >/dev/null 2>&1; then
  osascript -e 'display alert "BiteLog is already running" message "Open http://localhost:3030 in your browser, or close the existing BiteLog terminal window before starting it again."'
  exit 0
fi

if [[ ! -d node_modules ]]; then
  echo "Installing BiteLog dependencies. This only happens the first time."
  npx pnpm@10 install
fi

echo "Starting BiteLog at http://localhost:3030 ..."
npx pnpm@10 run dev -- --port 3030 --strictPort &
server_pid=$!

for _ in {1..60}; do
  if curl -fsS http://localhost:3030/ >/dev/null 2>&1; then
    open http://localhost:3030/
    echo "BiteLog is open in your browser. Keep this window open while you use the app."
    wait "$server_pid"
    exit $?
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "BiteLog could not start. Review the error above, then try again."
    wait "$server_pid"
    exit 1
  fi
  sleep 1
done

echo "BiteLog did not start within one minute."
exit 1
