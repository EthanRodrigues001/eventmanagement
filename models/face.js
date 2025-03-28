console.log("Script started...");
const fs = require("fs");
const path = require("path");
const faceapi = require("face-api.js");
const { Canvas, Image, ImageData, loadImage } = require("canvas");
const readlineSync = require("readline-sync");

// Monkey patch face-api.js to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const datasetPath = path.join(__dirname, "dataset_images");
const modelPath = __dirname;

// Ensure dataset directory exists
if (!fs.existsSync(datasetPath)) {
    fs.mkdirSync(datasetPath, { recursive: true });
}

// Load face-api.js models
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
}

// Function to extract all face descriptors from a given image
async function getFaceDescriptors(imagePath) {
    const image = await loadImage(imagePath);
    const canvas = faceapi.createCanvasFromMedia(image);
    
    const detections = await faceapi.detectAllFaces(canvas)
        .withFaceLandmarks()
        .withFaceDescriptors();
    
    return detections.map(d => d.descriptor); // Return an array of face descriptors
}

// Function to add an image to the dataset
async function addImage() {
    const imagePath = readlineSync.question("Enter the full path of the image to add: ").trim();
    
    if (!fs.existsSync(imagePath)) {
        console.log("Error: File not found!");
        return;
    }

    const imageName = path.basename(imagePath);
    const newImagePath = path.join(datasetPath, imageName);

    fs.copyFileSync(imagePath, newImagePath);
    console.log(`✅ Image ${imageName} added successfully!`);
}

// Function to search for a face in a group photo
async function searchFace() {
    const queryImagePath = readlineSync.question("Enter the full path of the image to search: ").trim();
    
    if (!fs.existsSync(queryImagePath)) {
        console.log("Error: Query image not found!");
        return;
    }

    console.log("🔍 Detecting faces in the query image...");
    const queryDescriptors = await getFaceDescriptors(queryImagePath);

    if (queryDescriptors.length === 0) {
        console.log("❌ No face detected in the query image!");
        return;
    }

    let bestMatches = [];

    // Compare with dataset images
    const datasetImages = fs.readdirSync(datasetPath);
    for (let img of datasetImages) {
        const imgPath = path.join(datasetPath, img);

        // Extract face descriptors from dataset image
        const datasetDescriptors = await getFaceDescriptors(imgPath);
        if (datasetDescriptors.length === 0) continue; // Skip if no face detected

        for (let queryDescriptor of queryDescriptors) {
            for (let datasetDescriptor of datasetDescriptors) {
                const distance = faceapi.euclideanDistance(queryDescriptor, datasetDescriptor);
                if (distance < 0.45) { // Stricter threshold
                    bestMatches.push({ imgPath, distance });
                }
            }
        }
    }

    if (bestMatches.length > 0) {
        console.log(`✅ Found ${bestMatches.length} Match(es):\n`);
        bestMatches.sort((a, b) => a.distance - b.distance); // Sort by best match

        for (const match of bestMatches) {
            console.log(`📷 Image: ${match.imgPath} | 🔍 Distance: ${match.distance.toFixed(4)}`);
        }
    } else {
        console.log("❌ No matching faces found.");
    }
}

// Main Menu
async function main() {
    await loadModels();
    
    while (true) {
        console.log("\n===== Face Recognition System =====");
        console.log("1. Add Photos to Dataset");
        console.log("2. Search for a Person in a Group Photo");
        console.log("3. Exit");

        const choice = readlineSync.question("Enter your choice: ").trim();

        if (choice === "1") {
            await addImage();
        } else if (choice === "2") {
            await searchFace();
        } else if (choice === "3") {
            console.log("Exiting...");
            break;
        } else {
            console.log("Invalid choice! Please enter 1, 2, or 3.");
        }
    }
}

// Run the program
main();
3