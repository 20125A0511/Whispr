import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase service client (can be shared or defined per route)
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

export async function POST(request: Request) {
  try {
    const { chatId, guestName } = await request.json();

    if (!chatId || !guestName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: chatId and guestName' },
        { status: 400 }
      );
    }

    if (typeof guestName !== 'string' || guestName.trim().length === 0 || guestName.trim().length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid guest name. Must be between 1 and 50 characters.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRoleClient();

    // 1. Fetch the chat session
    const { data: chatSession, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('host_name, is_active, invite_link_used')
      .eq('chat_id', chatId)
      .single(); // Use .single() if chatId is expected to be unique and you want an error if not found or multiple found

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: Row to be returned was not found
      console.error('Supabase error fetching chat session:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error validating invitation link.', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: 'This invitation is invalid or has expired.' }, // Not found
        { status: 404 }
      );
    }

    if (!chatSession.is_active) {
      return NextResponse.json(
        { success: false, error: 'This chat session is no longer active.' },
        { status: 410 } // Gone
      );
    }

    if (chatSession.invite_link_used) {
      return NextResponse.json(
        { success: false, error: 'This invitation link has already been used.' },
        { status: 403 } // Forbidden (or 410 Gone)
      );
    }

    // 2. Update the chat session to mark link as used and add guest name
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({ invite_link_used: true, guest_name: guestName.trim(), is_active: true }) // Ensure is_active remains true or is set true upon joining
      .eq('chat_id', chatId);

    if (updateError) {
      console.error('Supabase error updating chat session:', updateError);
      return NextResponse.json(
        { success: false, error: 'Could not process your join request.', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chatId,
      hostName: chatSession.host_name,
      guestName: guestName.trim(),
      message: 'Successfully joined the chat session.'
    });

  } catch (error) {
    console.error('Error in /api/validate-join:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json(
      { success: false, error: 'Server error validating join request.', details: errorMessage },
      { status: 500 }
    );
  }
} 