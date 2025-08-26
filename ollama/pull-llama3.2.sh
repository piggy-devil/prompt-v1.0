./bin/ollama serve &

pid=$!

sleep 5

echo "Pulling llama3.2 model"
ollama pull llama3.2

echo "Pulling bge-m3:latest model"
ollama pull bge-m3:latest

echo "Pulling gemma3:4b model"
ollama pull gemma3:4b

wait $pid