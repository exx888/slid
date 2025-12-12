SLID: Advanced Client-Side Reconnaissance and Data Harvester

🌟 Overview

SLID (Self-Hosted Location and Information Data collector) is a sophisticated Proof-of-Concept (PoC) web application designed to demonstrate the extensive potential for client-side data harvesting using modern browser APIs.

The tool presents a benign security or loading screen to the target user while silently and sequentially initiating requests for geolocation, camera access, and microphone recording in the background. The collected data is securely channeled to a dedicated Python Flask backend for processing and logging.

This project is intended strictly for educational purposes, security demonstrations, and testing user awareness and network defenses.

🎯 Key Features

SLID is engineered for comprehensive client-side data collection, including:

Precise Geolocation Capture: Logs Latitude, Longitude, and positional accuracy upon user consent (or via prompt dismissal).

KML File Generation: Automatically generates a googleearth.kml file on the server for instant visualization of the captured location.

Media Harvester:

Camera Snapshot: Performs a one-time capture of a frame from the user's primary camera (front-facing if available) and saves it as a PNG file.

Voice Recording: Records a 10-second audio clip (OGG format) using the microphone and saves it on the server.

Detailed Device Fingerprinting: Collects extensive non-sensitive device data, including:

Public IP Address

Operating System (OS) and Device Type

Browser Name and Version

Screen Resolution, Time Zone, and Local Time

CPU Core Count

Dual Operational Modes:

Normal Mode: Executes the collection process silently and displays a generic loading/verification message.

Spam Mode: Displays a customizable, high-impact phishing prompt (e.g., "Security Alert") to distract the user while the data collection runs in the background.

💻 Technical Stack

Component

Technology

Description

Backend

Python 3, Flask

Handles all API routes, data logging, media file processing (Base64 decoding), and KML generation.

Frontend

HTML5, JavaScript (ES6)

Initiates browser API calls (navigator.geolocation, mediaDevices), manages media streams, and sends payloads to the server.

Styling

Tailwind CSS

Provides a clean, modern, and responsive user interface for the decoy page.

Logging

tabulate (Python)

Provides clean, well-structured output to the server console and structured logging to the captured_data.log file.

⚠️ Disclaimer

The creator of this tool is not responsible for any misuse. Users are solely responsible for compliance with all applicable local, state, and federal laws. Do not use this tool on systems or networks without explicit, written permission from the owner.
