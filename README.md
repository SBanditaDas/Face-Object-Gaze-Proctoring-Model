# 🛡️ AI Face-Object-Gaze Proctoring System

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-Discipline-orange?logo=tensorflow)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-green?logo=google)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-cyan?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple)

> **"The Super Brain"**: A next-generation, browser-based proctoring solution that combines **four** powerful AI models to detect identity fraud, unauthorized objects, and suspicious behavior in real-time.

---

## 🚀 Overview

This project is a sophisticated **React + TypeScript/Vite** application designed to ensure the integrity of online examinations. Unlike traditional proctoring tools that rely on backend streaming (high latency/cost), this system runs **entirely on the client-side (Edge AI)** using TensorFlow.js.

It creates a "Vector Database" of the user's face in the browser memory and performs continuous biometric authentication without sending sensitive video data to any server.

---

## 🧠 The "Super Brain" Architecture

The system loads **4 Neural Networks** in parallel to create a comprehensive surveillance mesh:

| Model | Function | Technology |
|-------|----------|------------|
| **MobileNetV2** | **Identity Lock**: Extracts 128-d facial embeddings to verify if the person sitting is the actual candidate. | `tfjs-models` |
| **COCO-SSD** | **Object Detection**: Scans the room for unauthorized items like **Cell Phones** 📱 or **Books** 📕. | `@tensorflow-models/coco-ssd` |
| **BlazeFace** | **Head Counting**: Detects if **multiple people** are in the frame or if the user leaves the seat. | `@mediapipe/face-detection` |
| **Face Mesh** | **Behavior Analysis**: Tracks **468 facial landmarks** to detect **Gaze Deviation** (looking away) and **Lip Movement** (talking). | `@mediapipe/face-mesh` |

---

## ✨ Key Features

### 🔒 Phase 1: Identity Calibration ("The Lock")
- Captures a high-quality baseline image of the user.
- Generates a unique **Tensor Vector** (Voiceprint for the face).
- Locks this biometric signature into the session memory.

### 🛡️ Phase 2: The Omni-Proctor Loop
- **Real-Time Verification**: Calculates **Cosine Similarity** between the live webcam feed and the locked baseline every frame.
- **Strike System**: Implements a robustness layer where users must be mismatched for **30 consecutive frames** (~1s) to trigger an alert, preventing false positives.
- **Cooldowns**: Smart throttling prevents alert fatigue by limiting duplicate warnings.

### 👁️ Phase 3: Attention Tracking
- **Gaze Detection**: Uses Iris tracking to determine if the user is looking at the screen or cheating by looking sideways.
- **Talking Detection**: Measures the vertical distance between lip landmarks to detect speaking or whispering.

### 🎨 Phase 4: Professional Exam UI
- **Two-State Interface**: Seamlessly transitions from a dark-themed **Calibration Mode** to a focused, light-themed **Exam Mode**.
- **Live Audit Trail**: A scrolling log of all violations (e.g., "Looking Away", "Mobile Detected") with timestamps and severity levels.
- **Post-Exam Report**: A detailed dashboard summarizing the session's integrity score.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite.
- **Styling**: Tailwind CSS (with `animate-in` transitions).
- **AI/ML**: TensorFlow.js, MediaPipe.
- **State Management**: React Hooks (`useRef` for performance optimization).
- **Computer Vision**: Canvas API manipulation, Tensor Math.

---

## 📦 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/SBanditaDas/Face-Object-Gaze-Proctoring-Model.git
   cd Face-Object-Gaze-Proctoring-Model
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   *Note: This will fetch the heavy TF.js and MediaPipe binaries.*

3. **Download Model Assets**
   - Ensure the `./public/models` directory contains the shard files for the Face Recognition model.
   - *Included in this repo.*

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to test the Super Brain!

---

## 🎮 Usage Guide

1. **Allow Camera Access**: The app requires webcam permissions.
2. **Align Your Face**: Center yourself in the "Calibration" circle.
3. **Lock Identity**: Click the "Lock Identity & Start Exam" button.
4. **Take the Exam**:
   - The UI will switch to the exam view.
   - Try converting the cheating behaviors (hold a phone, look away, or speak) to test the AI.
   - The "Live Violation Log" on the right sidebar will update instantly.
5. **End Session**: Click "Submit Exam" to view your **Integrity Score**.

---

## ⚠️ Privacy Note

This application processes **all video data locally** on the user's device. 
- No video feeds are sent to any server.
- No facial images are stored in a database.
- The "Vector Embeddings" exist only in the browser's RAM during the session.

---

## 🤝 Contributing

Contributions are welcome! Please fork this repository and submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by Bandita Das using React & TensorFlow.js</sub>
</div>
