import { createClient } from '@supabase/supabase-js';

// Supabase Client for Auth and Storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth Helper Functions
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

export async function signUp(email: string, password: string, metadata?: object) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
}

export async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    return { data, error };
}

// Storage Helper Functions
const BUCKET_NAME = 'attendance-photos';

export async function uploadAttendancePhoto(
    userId: string,
    file: File
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, error: null };
    } catch (error) {
        return { url: null, error: error as Error };
    }
}

export async function uploadAvatar(
    userId: string,
    file: File
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${userId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, error: null };
    } catch (error) {
        return { url: null, error: error as Error };
    }
}

export async function uploadBlogImage(
    postId: string,
    file: File
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `blog/${postId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, error: null };
    } catch (error) {
        return { url: null, error: error as Error };
    }
}

export async function deleteFile(filePath: string) {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
    return { error };
}

// Auth State Change Listener
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
}
