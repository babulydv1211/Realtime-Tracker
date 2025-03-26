
const socket = io(); // Connect to backend

// Check if Geolocation is available in browser
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log("User location:", latitude, longitude);
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true, // Get precise location
            timeout: 5000, // Wait max 5 sec before timing out
            maximumAge: 0, // Do not use cached location
        }
    );
}

// Initialize Leaflet Map (Start with a neutral position)
const map = L.map("map").setView([20.5937, 78.9629], 5); // Default location (India)

// Load OpenStreetMap Tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Store markers for each user
const markers = {};
let firstUpdate = true; // Track first update to center the map

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    console.log(`Received location from user ${id}: ${latitude}, ${longitude}`);

    // Center the map on the first update
    if (firstUpdate) {
        map.setView([latitude, longitude], 16);
        firstUpdate = false;
    }

    // Update existing marker or add a new one
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Update marker position
    } else {
        markers[id] = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`User ${id} is here`)
            .openPopup(); // Open popup for the new marker
    }
});

// Remove marker when user disconnects
socket.on("user-disconnect", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
        console.log(`User ${id} disconnected, marker removed.`);
    }
});
