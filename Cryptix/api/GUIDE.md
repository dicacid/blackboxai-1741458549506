# Cryptix API Guide

This guide will help you understand and use the Cryptix API service.

## Getting Started

1. Start the API server:
```bash
cd Cryptix/api
./run.sh
```

The API will be available at http://localhost:5001

## Testing the API

You can use `curl` commands to test each endpoint:

### 1. View API Documentation
```bash
curl http://localhost:5001/
```

This shows all available endpoints and their descriptions.

### 2. Check API Health
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
    "status": "healthy",
    "timestamp": "2025-02-25T04:26:03.752225"
}
```

### 3. Log Requests (GET)
```bash
curl http://localhost:5001/log
```

This endpoint logs the request and returns request details.

### 4. Log Requests (POST)
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}' \
     http://localhost:5001/log
```

## Common Tasks

1. **Starting the API**: 
   - Run `./run.sh` in the api directory
   - Wait for the "Running on http://127.0.0.1:5001" message

2. **Checking if API is working**:
   - Open http://localhost:5001/health in your browser
   - Or use `curl http://localhost:5001/health`

3. **Viewing logs**:
   - Check the terminal where the API is running
   - Look in the `api/logs` directory for log files

4. **Stopping the API**:
   - Press Ctrl+C in the terminal where the API is running

## Troubleshooting

1. If port 5001 is in use:
   - Edit run.sh and change the port number
   - Or stop the process using that port

2. If you see "Permission denied":
   - Run `chmod +x run.sh` to make the script executable

3. If Python packages are missing:
   - Run `pip install -r requirements.txt`

## Next Steps

1. Integrate this API with your frontend:
   - Use the /log endpoint to track user actions
   - Use the /health endpoint for monitoring

2. Add more endpoints:
   - Copy the existing endpoint patterns in app.py
   - Update the API documentation

3. Enhance security:
   - Add authentication
   - Rate limiting
   - HTTPS support
