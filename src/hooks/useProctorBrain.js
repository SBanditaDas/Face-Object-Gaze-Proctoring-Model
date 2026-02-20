import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Ensure the MediaPipe WASM backend is ready
import '@mediapipe/face_detection';
import '@mediapipe/face_mesh';

export const useProctorBrain = () => {
    const [model, setModel] = useState(null);
    const [objectModel, setObjectModel] = useState(null);
    const [faceDetector, setFaceDetector] = useState(null);
    const [landmarkDetector, setLandmarkDetector] = useState(null);
    const [isAwake, setIsAwake] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const wakeUpBrain = async () => {
            try {
                console.log("Initializing Omni-Proctor Super Brain...");

                // 1. Wait for TF.js
                await tf.ready();

                // 2. Load ALL models in parallel (The "Super Brain")
                const [
                    loadedFaceModel,
                    loadedObjectModel,
                    loadedFaceDetector,
                    loadedLandmarkDetector
                ] = await Promise.all([
                    tf.loadGraphModel('/models/model.json'),
                    cocoSsd.load(),
                    faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, { runtime: 'tfjs' }),
                    faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, { runtime: 'tfjs' })
                ]);

                setModel(loadedFaceModel);
                setObjectModel(loadedObjectModel);
                setFaceDetector(loadedFaceDetector);
                setLandmarkDetector(loadedLandmarkDetector);

                setIsAwake(true);
                console.log("✅ SUPER BRAIN ONLINE: Face ID, Objects, Counts, and Mesh are ready.");
            } catch (err) {
                console.error("❌ Brain failed to load:", err);
                setError(err.message);
            }
        };

        wakeUpBrain();
    }, []);

    return { model, objectModel, faceDetector, landmarkDetector, isAwake, error };
};
