import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId } = body;

    if (!chatId || typeof chatId !== 'string') {
      return NextResponse.json({ error: 'chatId is required and must be a string' }, { status: 400 });
    }

    // 1. Mark the chat session as inactive
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('chat_id', chatId);

    if (sessionError) {
      console.error('Error updating chat session to inactive:', sessionError);
      return NextResponse.json({ error: 'Failed to end chat session', details: sessionError.message }, { status: 500 });
    }

    // 2. Permanently delete chat messages for the given chatId
    const { error: messagesError } = await supabase
      .from('temporary_chat_messages')
      .delete()
      .eq('chat_id', chatId);

    if (messagesError) {
      console.error('Error deleting chat messages:', messagesError);
      // If updating session was OK, but message deletion failed, this is a partial success.
      // Depending on desired atomicity, might need to decide how to respond.
      // For now, let's report the message deletion error if it occurs.
      return NextResponse.json({ error: 'Failed to delete chat messages', details: messagesError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Chat session ended and messages deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error in end-chat-session handler:', error);
    if (error.name === 'SyntaxError' || (error.type && error.type === 'entity.parse.failed')) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
