import { supabase } from '@/utils/supabase'; // Assuming this is the correct path
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json({ success: false, error: "chatId is required." }, { status: 400 });
    }

    // Optional: Check if the chat session exists and is currently active
    // This adds a bit of robustness, though not strictly required by the prompt
    const { data: existingSession, error: selectError } = await supabase
      .from('chat_sessions')
      .select('chat_id, is_active')
      .eq('chat_id', chatId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for this check
      console.error('Supabase error selecting chat session:', selectError);
      // If we can't even select, it might be a broader issue
      return NextResponse.json({ success: false, error: "Failed to query chat session details." }, { status: 500 });
    }

    if (!existingSession) {
      // If the chat session doesn't exist, we can consider it "ended" or return a 404
      // For this implementation, let's return a 404 as it's more specific.
      return NextResponse.json({ success: false, error: "Chat session not found." }, { status: 404 });
    }

    // If it's already inactive, we can return success without an update
    if (existingSession && !existingSession.is_active) {
      return NextResponse.json({ success: true, message: "Chat session was already ended." }, { status: 200 });
    }

    // Update the chat session to be inactive
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({ is_active: false, updated_at: new Date().toISOString() }) // Also update updated_at
      .eq('chat_id', chatId);

    if (updateError) {
      console.error('Supabase error ending chat session:', updateError);
      return NextResponse.json({ success: false, error: "Failed to end chat session." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Chat session ended." }, { status: 200 });

  } catch (e: any) {
    // Handle cases where req.json() might fail (e.g., invalid JSON)
    if (e instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
    }
    console.error('API error in /api/end-chat-session:', e);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
