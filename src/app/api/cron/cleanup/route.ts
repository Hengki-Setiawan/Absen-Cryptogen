import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Using anon key for now, ideally service role for admin tasks
// Note: In a real production env, use SERVICE_ROLE_KEY for admin tasks to bypass RLS if needed, 
// but here we assume the key has enough permissions or RLS allows delete for own files (or we rely on anon key having delete permissions which might be risky but fits current setup).
// Ideally we should use a separate env var for service role key.

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
        }

        // 1. List all files in the bucket
        // Note: list() might be paginated, for now we fetch top 1000 which should be enough for daily cleanup
        const { data: files, error: listError } = await supabase.storage
            .from('attendance-photos')
            .list('', { limit: 1000, offset: 0 });

        if (listError) throw listError;

        if (!files || files.length === 0) {
            return NextResponse.json({ message: 'No files to clean', deletedCount: 0 });
        }

        const now = Date.now();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const filesToDelete: string[] = [];

        // 2. Iterate and identify old files
        for (const file of files) {
            // Skip folders
            if (!file.id) continue; // Folders don't have ID in some responses, or check name

            // Skip avatars folder
            if (file.name === 'avatars') continue;

            // If it's a folder (student ID), we need to list inside it?
            // Wait, supabase .list('') returns top level items.
            // Our structure is: `studentId/timestamp.ext` OR `avatars/timestamp.ext`
            // So .list('') returns folders (studentIds) and 'avatars' folder.
            // We need to traverse.

            // Actually, Supabase storage list is flat-ish but organized by folders.
            // If we list root, we get folders.

            // Let's try a different approach: Recursive list is hard.
            // But we know the structure.
            // Maybe we can just list everything recursively if Supabase supports it? 
            // Supabase JS list accepts 'search' but not recursive flag directly in simple way.

            // Alternative: We iterate top level folders (which are student IDs).
        }

        // Revised Strategy:
        // 1. List top level folders (Student IDs + 'avatars')
        // 2. For each student folder, list files.
        // 3. Check timestamps.

        let deletedCount = 0;

        // List top level items (folders)
        const { data: folders, error: foldersError } = await supabase.storage
            .from('attendance-photos')
            .list();

        if (foldersError) throw foldersError;

        for (const folder of folders) {
            if (folder.name === 'avatars') continue; // Skip avatars
            if (folder.name === '.emptyFolderPlaceholder') continue;

            // List files in this student's folder
            const { data: studentFiles, error: studentFilesError } = await supabase.storage
                .from('attendance-photos')
                .list(folder.name);

            if (studentFilesError) {
                console.error(`Error listing files for ${folder.name}:`, studentFilesError);
                continue;
            }

            const studentFilesToDelete: string[] = [];

            for (const file of studentFiles) {
                // Filename format: timestamp.ext
                const timestampStr = file.name.split('.')[0];
                const timestamp = parseInt(timestampStr);

                if (!isNaN(timestamp)) {
                    if (now - timestamp > ONE_DAY_MS) {
                        studentFilesToDelete.push(`${folder.name}/${file.name}`);
                    }
                }
            }

            if (studentFilesToDelete.length > 0) {
                const { error: deleteError } = await supabase.storage
                    .from('attendance-photos')
                    .remove(studentFilesToDelete);

                if (deleteError) {
                    console.error(`Error deleting files for ${folder.name}:`, deleteError);
                } else {
                    deletedCount += studentFilesToDelete.length;
                }
            }
        }

        return NextResponse.json({ success: true, deletedCount });
    } catch (error: any) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: error.message || 'Cleanup failed' }, { status: 500 });
    }
}
