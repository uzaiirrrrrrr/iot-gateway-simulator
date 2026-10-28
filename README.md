# Cloud Integrated Secure IoT Gateway Simulator 🚀

A high-fidelity, production-ready IoT Gateway Simulator developed for a Final Year Project. This system features 12 integrated modules for real-time traffic monitoring, security visualization, attack simulation, and automated reporting.

## 🌟 Key Features
- **12 Interactive Modules**: Dedicated pages for Network Visualization, Cloud Pipeline, System Health, and more.
- **Attack Sandbox**: Trigger DDoS, XML Injection, and Brute Force attacks in a safe environment.
- **Training Lab**: Guided security drills with task-based learning and real-time feedback.
- **Secure Communication**: Built-in TLS 1.3 vs Plaintext visualization (Module 4).
- **Automated Reporting**: ISO-compliant PDF reports for audit and compliance.
- **High-Fidelity UI**: Developed with React, Tailwind CSS (v4), Framer Motion, and Chart.js.

## 🏗️ System Architecture
- **Frontend**: React (Vite) + Lucide Icons + Framer Motion.
- **Backend**: Node.js + Express.js + Modular Simulation Engine.
- **Database**: PostgreSQL (Fully normalized schema).

## 🚀 Quick Start
1. **Prerequisites**: Install Node.js and PostgreSQL.
2. **Setup**: 
   - Configure `.env` in the `backend/` directory.
   - Run `npm install` in both `frontend/` and `backend/` folders.
3. **Launch**: Open a terminal in the root directory and run:
   ```bash
   npm run dev
   ```
   *Alternatively, you can still run the provided `run_simulator.bat` file.*
4. **Access**: Navigate to `http://localhost:5173` in your browser.

## 🛡️ Module Integration Matrix
1. **Dashboard**: Traffic Trends, Network Nodes & Real-time Charts.
2. **Manage and Simulate Gateways**: Gateway infrastructure management & simulation.
3. **Provision and Map Devices**: IoT device registration & gateway drag-and-drop mapping.
4. **Visualize Secure and Insecure Traffic**: Real-time packet flow visualization (TLS 1.3 vs Plaintext inspection).
5. **Monitor Traffic Analytics**: Packet throughput tracking, bandwidth analysis & traffic spike anomaly alerts.
6. **Simulate Cloud Pipelines**: Multi-cloud broker streaming (AWS/Azure/GCP) & link latency simulation.
7. **Detect Anomalies and Monitor Health**: Real-time heartbeat tracking & AI anomaly diagnostics.
8. **View Centralized Logs and Alerts**: Unified system event journal, severity sorting & alert storage.
9. **Generate Compliance Reports**: Regulatory compliance verification (ISO 27001) & PDF document generation.
10. **Perform Simulation Training**: Interactive guided security training drills & operational exercises.
11. **Simulate Cyber Attacks and Defenses**: Attack sandbox simulating DDoS, XML Injection, and brute force vectors.
12. **Audit User Behavior and Access**: Detailed operator access tracking, privilege escalation audits & audit trails.

## 🎓 Final Year Project (FYP) Credits
Developed as a comprehensive solution for secure IoT gateway operations and visualization.
