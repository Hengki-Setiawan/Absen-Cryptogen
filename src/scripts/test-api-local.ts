import { attendanceSchema } from '@/lib/validations';

async function testApi() {
    const payload = {
        studentId: '57ddf2d5-f934-4169-bae1-b52264e677dc', // Valid Student ID from previous step
        courseId: '1e6a0a54-5cdc-43d4-8600-a1720e017186', // Valid Schedule ID from previous step
        attendanceDate: '2026-01-28',
        status: 'hadir',
        notes: 'Test API direct',
        photoUrl: null,
        isQr: true
    };

    console.log('Testing API with payload:', payload);

    try {
        const response = await fetch('http://localhost:3000/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
