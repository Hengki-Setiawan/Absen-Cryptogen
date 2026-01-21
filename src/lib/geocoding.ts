export async function getAddressFromCoordinates(lat: number, lon: number): Promise<string | null> {
    try {
        // Use OpenStreetMap Nominatim API (Free)
        // Must provide a valid User-Agent
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: {
                'User-Agent': 'AbsenCryptogen/1.0 (hengki@example.com)' // Replace with appropriate info
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch address');
        }

        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}
