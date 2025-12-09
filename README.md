
<img width="900" height="560" alt="Screenshot 2025-12-09 at 16 21 54" src="https://github.com/user-attachments/assets/426ae3e7-9459-4014-a4f5-f094208eb05e" />

**NetShield** is a custom-built local DNS sinkhole designed to improve network privacy and block advertisements at the source. It intercepts DNS queries, filters them against a blocklist, and visualizes network traffic velocity in real-time.

## Features
 **Ad & Tracker Blocking:** Filters DNS queries to stop ads network-wide.
 **Live Visualization:** Real-time graph of traffic velocity and query volume.
 **Threat Detection:** Logs and counts blocked requests.
 **Simulation Mode:** Includes a backend simulation for UI stress testing.

## Tech Stack
 **Language:** Python 3
 **Networking:** UDP Socket Programming (Port 53)
 **Frontend:** Typescript, Html, Css

## Usage
To run the backend server (requires root privileges for port 53):

```bash
sudo python3 netshield_server.py
