import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase service client (similar to other API routes)
const getSupabaseServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase environment variables not set for service role client.');
    throw new Error('Server configuration error for Supabase.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

export async function POST(request) {
  try {
    // Get chat ID from request
    const { chatId, userId } = await request.json();
    
    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Missing chat ID' },
        { status: 400 }
      );
    }
    
    // Get Supabase client using the helper
    const supabase = getSupabaseServiceRoleClient();
    
    // Update chat session to inactive
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('chat_id', chatId);
    
    if (error) {
      console.error('Error ending chat session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to end chat session' },
        { status: 500 }
      );
    }
    
    // Also add a system message to notify users
    await supabase
      .from('temporary_chat_messages')
      .insert({
        chat_id: chatId,
        user_id: userId || null,
        sender_name: 'System',
        message_text: 'The host has ended this chat session.',
      });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in end-chat-session API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
} 