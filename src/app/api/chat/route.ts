import { NextRequest, NextResponse } from 'next/server';
import { getChatContext, buildSystemPrompt } from '@/lib/chatbot-context';

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Best free model on OpenRouter
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: 'Chatbot belum dikonfigurasi. Hubungi administrator.',
                reply: 'Maaf, chatbot sedang tidak tersedia. Silakan hubungi administrator untuk mengaktifkan fitur ini.'
            }, { status: 503 });
        }

        // Get context from database
        const context = await getChatContext();
        const systemPrompt = buildSystemPrompt(context);

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(history || []).slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];

        // Call OpenRouter API
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'Cryptgen Class Chatbot',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', response.status, errorData);
            return NextResponse.json({
                error: 'Gagal menghubungi AI',
                reply: 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi nanti.'
            }, { status: 500 });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat memberikan respons saat ini.';

        return NextResponse.json({
            reply,
            model: MODEL
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            reply: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
        }, { status: 500 });
    }
}
