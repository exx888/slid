






SLID is a smart analysis engine built with Python, designed for high-speed processing, accurate behavioral analysis, and a web-based interface that can run locally or via Ngrok.
Lightweight, stable, and easy to run—ideal for testing and development environments.

✨ Features
🔍 Core Engines

Real-Time Processing — High-speed engine that executes tasks instantly.

Web-Based UI — Simple interface accessible on local port 8080.

Modular Codebase — Organized code, easy to extend and add new features.

Local Privacy — All analysis is performed locally; no data is sent externally.

Cross-Platform Support — Works on Windows / Linux / macOS.

📦 Requirements

All required Python libraries are included in:

requirements.txt


To install dependencies:

pip install -r requirements.txt

🔧 Installation
1. Clone the Repository
git clone https://github.com/exx888/slid.git
cd slid

2. Install Dependencies
pip install -r requirements.txt

🚀 Usage Guide
1. 🔗 Run Ngrok (Optional — For External Access)

If you want to access SLID from outside your machine, run Ngrok on port 8080:

ngrok http 8080


Ngrok will provide an HTTPS link to access the tool remotely.

2. ▶️ Run SLID

Launch the main application:

python3 app.py


Access the interface locally at:

http://127.0.0.1:8080


Or use the Ngrok link if enabled.

🤝 Contributing

We welcome contributions:

Fork the repository

Create a new branch

Make your changes

Open a Pull Request for review
