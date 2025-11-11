#!/bin/bash

echo "Testing common SSH ports for 92.113.19.61..."

for port in 22 2222 21098 65002; do
    echo "Testing port $port..."
    timeout 5 bash -c "echo > /dev/tcp/92.113.19.61/$port" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Port $port is open"
    else
        echo "✗ Port $port is closed or filtered"
    fi
done
