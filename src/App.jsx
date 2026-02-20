import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { useProctorBrain } from './hooks/useProctorBrain';

// 1. The Magic Math Function
const calculateCosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

function App() {
  const { model, objectModel, faceDetector, landmarkDetector, isAwake, error } = useProctorBrain();
  const webcamRef = useRef(null);

  // 2. The Identity States
  const [baselineEmbedding, setBaselineEmbedding] = useState(null);
  const baselineRef = useRef(null); // Fix: Stale closure prevention
  const [matchScore, setMatchScore] = useState(100);
  const [violations, setViolations] = useState([]);
  const [examEnded, setExamEnded] = useState(false);

  const requestRef = useRef();
  const lastDetectionTime = useRef(0);
  const lastTalkingTime = useRef(0);
  const lastGazeTime = useRef(0);

  // Robustness Refs
  const mismatchStrikes = useRef(0);
  const lastMismatchTime = useRef(0);

  // Sync state to ref for the animation loop
  useEffect(() => {
    baselineRef.current = baselineEmbedding;
  }, [baselineEmbedding]);

  // Helper to calculate severity counts
  const getSeverityCounts = () => {
    const critical = violations.filter(v => v.severity === "Critical").length;
    const warning = violations.filter(v => v.severity === "Warning").length;
    return { critical, warning };
  };

  // Mocking the Phase 4 Audit Trail
  const addViolation = (incident) => {
    setViolations(prev => {
      // Debounce exact same violation type within 2 seconds to avoid spam
      const recent = prev[0];
      if (recent && recent.type === incident.type && new Date() - new Date("1970-01-01T" + recent.time) < 2000) {
        return prev;
      }

      const newViolation = { ...incident, time: new Date().toLocaleTimeString() };
      console.warn("🚨 VIOLATION LOGGED:", newViolation);
      return [newViolation, ...prev];
    });
  };

  // 3. The Baseline Capture Function
  const lockIdentity = async () => {
    if (webcamRef.current && model && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const imgTensor = tf.browser.fromPixels(video);
      const resized = tf.image.resizeBilinear(imgTensor, [160, 160]);
      const floatTensor = resized.toFloat();
      const normalized = floatTensor.div(tf.scalar(127.5)).sub(tf.scalar(1));
      const expanded = normalized.expandDims(0);

      const prediction = await model.predict(expanded);
      const embeddingData = await prediction.data();

      // Save the baseline to state!
      setBaselineEmbedding(Array.from(embeddingData));
      console.log("🔒 Baseline Identity Locked!");

      tf.dispose([imgTensor, resized, floatTensor, normalized, expanded, prediction]);
    }
  };

  // 4. The Continuous Surveillance Loop
  const runSurveillance = useCallback(async () => {
    // STOP if exam has ended
    if (examEnded) return;

    if (webcamRef.current && webcamRef.current.video.readyState === 4 && model) {
      const video = webcamRef.current.video;
      const imgTensor = tf.browser.fromPixels(video);
      const resized = tf.image.resizeBilinear(imgTensor, [160, 160]);
      const floatTensor = resized.toFloat();
      const normalized = floatTensor.div(tf.scalar(127.5)).sub(tf.scalar(1));
      const expanded = normalized.expandDims(0);

      const prediction = await model.predict(expanded);
      const currentEmbedding = await prediction.data();

      // 🔥 THE INTEGRITY DECISION ENGINE 🔥
      // Fix: Use ref instead of state to avoid stale closures
      if (baselineRef.current) {
        const similarity = calculateCosineSimilarity(baselineRef.current, Array.from(currentEmbedding));
        const percentage = (Math.max(0, similarity) * 100).toFixed(1);
        setMatchScore(percentage);

        // 🛡️ Robust Strike System
        const now = Date.now();

        // Threshold relaxed to 0.75
        if (similarity < 0.75) {
          mismatchStrikes.current += 1;
        } else {
          mismatchStrikes.current = 0; // Reset if face matches
        }

        // Logic: > 30 frames (~1 sec) of mismatch AND 4s cooldown since last alert
        if (mismatchStrikes.current > 30 && now - lastMismatchTime.current > 4000) {
          addViolation({ type: "IDENTITY_MISMATCH", severity: "Critical" });
          lastMismatchTime.current = now;
          mismatchStrikes.current = 0; // Reset strikes
        }

        // B. Omni-Proctor Checks (Objects, Faces, Gaze) - Throttled to 500ms
        if (now - lastDetectionTime.current > 500) {

          // 1. Object Detection (COCO-SSD)
          if (objectModel) {
            const detections = await objectModel.detect(video);
            const forbidden = detections.filter(obj => obj.class === 'cell phone' || obj.class === 'book');
            if (forbidden.length > 0) {
              const uniqueTypes = [...new Set(forbidden.map(f => f.class))];
              addViolation({ type: `UNAUTHORIZED_OBJECT: ${uniqueTypes.join(", ")}`, severity: "Warning" });
            }
          }

          // 2. Face Counting (MediaPipe Face Detection)
          if (faceDetector) {
            const faces = await faceDetector.estimateFaces(video);
            if (faces.length > 1) {
              addViolation({ type: "MULTIPLE_FACES_DETECTED", severity: "Critical" });
            } else if (faces.length === 0) {
              addViolation({ type: "NO_FACE_IN_FRAME", severity: "Critical" });
            }
          }

          // 3. Face Mesh (Gaze/Lip Tracking)
          if (landmarkDetector) {
            const landmarks = await landmarkDetector.estimateFaces(video);
            if (landmarks.length > 0) {
              const keypoints = landmarks[0].keypoints;

              // A. Lip Movement (Talking) - Threshold 10px (adjustable)
              const upperLip = keypoints[13];
              const lowerLip = keypoints[14];
              const lipDistance = Math.abs(upperLip.y - lowerLip.y);

              if (lipDistance > 5 && now - lastTalkingTime.current > 2000) { // 5px threshold for "open"
                addViolation({ type: "TALKING_DETECTED", severity: "Warning" });
                lastTalkingTime.current = now;
              }

              // B. Gaze Tracking (Horizontal Deviation)
              const leftEyeLeft = keypoints[33];   // Outer corner
              const leftEyeRight = keypoints[133]; // Inner corner
              const leftIris = keypoints[468];     // Iris Center

              // Calculate Eye Width
              const eyeWidth = Math.abs(leftEyeRight.x - leftEyeLeft.x);

              // Calculate Iris Position (Distance from outer corner)
              const irisDist = Math.abs(leftIris.x - leftEyeLeft.x);

              // Calculate Ratio (0 = Left, 1 = Right, 0.5 = Center)
              if (eyeWidth > 0) {
                const gazeRatio = irisDist / eyeWidth;

                // Thresholds: < 0.35 (Looking Right/Away) or > 0.65 (Looking Left/Away)
                // Note: Mirror mode might flip these, but deviation from 0.5 is the key.
                if ((gazeRatio < 0.30 || gazeRatio > 0.70) && now - lastGazeTime.current > 2000) {
                  addViolation({ type: "LOOKING_AWAY_FROM_SCREEN", severity: "Warning" });
                  lastGazeTime.current = now;
                }
              }
            }
          }

          lastDetectionTime.current = now;
        }
      }

      tf.dispose([imgTensor, resized, floatTensor, normalized, expanded, prediction]);
    }
    requestRef.current = requestAnimationFrame(runSurveillance);
  }, [model, baselineEmbedding, examEnded, objectModel, faceDetector, landmarkDetector]);

  useEffect(() => {
    if (isAwake) {
      requestRef.current = requestAnimationFrame(runSurveillance);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isAwake, runSurveillance]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-4">
          {examEnded ? "Post-Exam Audit" : "Identity Lock"}
        </h1>

        {!examEnded ? (
          <>
            {/* Status Indicators */}
            {error && (
              <div className="text-red-400 bg-red-400/10 border border-red-500/30 p-4 rounded-lg mb-4">
                ❌ Error: {error}
              </div>
            )}

            <div className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-800 mb-4 max-w-md mx-auto">
              <Webcam
                ref={webcamRef}
                audio={false}
                className="w-full h-full object-cover"
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 160,
                  height: 160,
                  facingMode: "user"
                }}
              />
            </div>

            {!baselineEmbedding ? (
              <button
                disabled={!isAwake}
                onClick={lockIdentity}
                className={`w-full max-w-md font-bold py-3 px-4 rounded-lg transition-colors ${!isAwake ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {isAwake ? "Lock Identity & Start Exam" : "Initializing AI..."}
              </button>
            ) : (
              <div className="space-y-4 max-w-md mx-auto">
                <div className={`p-4 rounded-lg font-bold text-xl ${matchScore > 85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  Match Score: {matchScore}%
                </div>
                {violations.length > 0 && (
                  <div className="text-left bg-slate-800 p-4 rounded-lg overflow-y-auto max-h-32 text-sm">
                    <h3 className="text-red-400 font-bold mb-2">Audit Trail</h3>
                    {violations.map((v, i) => (
                      <div key={i} className="text-slate-300 border-l-2 border-red-500 pl-2 mb-1">
                        [{v.time}] {v.type}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setExamEnded(true)}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4"
                >
                  End Exam
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Violations</h3>
                <p className="text-4xl font-bold text-white">{violations.length}</p>
              </div>
              <div className="bg-red-900/20 p-6 rounded-lg border border-red-500/30">
                <h3 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">Critical Severity</h3>
                <p className="text-4xl font-bold text-red-400">{getSeverityCounts().critical}</p>
              </div>
              <div className="bg-amber-900/20 p-6 rounded-lg border border-amber-500/30">
                <h3 className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-2">Warning Severity</h3>
                <p className="text-4xl font-bold text-amber-400">{getSeverityCounts().warning}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Detailed Audit Log
            </h3>

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-y-auto max-h-96">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-700/50 sticky top-0">
                    <tr>
                      <th className="p-4 text-slate-300 font-semibold text-sm">Timestamp</th>
                      <th className="p-4 text-slate-300 font-semibold text-sm">Violation Type</th>
                      <th className="p-4 text-slate-300 font-semibold text-sm">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {violations.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-slate-500 italic">
                          No violations detected during this session.
                        </td>
                      </tr>
                    ) : (
                      violations.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                          <td className="p-4 text-slate-400 font-mono text-sm">{v.time}</td>
                          <td className="p-4 text-white font-medium">{v.type}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${v.severity === 'Critical'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                              {v.severity || 'Warning'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium"
              >
                Start New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
