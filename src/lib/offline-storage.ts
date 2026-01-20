export const DB_NAME = 'absen-offline-db';
export const STORE_NAME = 'submissions';

export async function openDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveOfflineSubmission(data: any) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({ ...data, createdAt: Date.now() });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getOfflineSubmissions() {
    const db = await openDB();
    return new Promise<any[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function clearOfflineSubmissions(ids: number[]) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        ids.forEach(id => store.delete(id));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}
