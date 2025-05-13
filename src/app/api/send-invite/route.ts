import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!resendApiKey) {
  console.error("Error: RESEND_API_KEY environment variable is not set.");
  // Do not throw an error that reveals server configuration details to the client in production
}
if (!resendFromEmail) {
  console.error("Error: RESEND_FROM_EMAIL environment variable is not set.");
}
if (!siteUrl) {
  console.error("Error: NEXT_PUBLIC_SITE_URL environment variable is not set.");
}

const resend = new Resend(resendApiKey);

export async function POST(request: Request) {
  if (!resendApiKey || !resendFromEmail || !siteUrl) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error. Email sending is disabled.' },
      { status: 500 }
    );
  }

  try {
    const { guestEmail, chatId, hostName } = await request.json();

    if (!guestEmail || !chatId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: guestEmail and chatId' },
        { status: 400 }
      );
    }

    const chatLink = `${siteUrl}/chat/${chatId}`;
    const invitingUser = hostName || 'Someone';

    const emailHtml = `
      <div>
        <h2>You've been invited to a chat!</h2>
        <p>Hi there,</p>
        <p><strong>${invitingUser}</strong> has invited you to join a private chat.</p>
        <p>Click the link below to join:</p>
        <p><a href="${chatLink}" target="_blank">Join Chat</a></p>
        <p>Chat ID: ${chatId}</p>
        <p>If you were not expecting this invitation, please ignore this email.</p>
        <p>Thanks,<br/>The Team</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: resendFromEmail, 
      to: [guestEmail],
      subject: `${invitingUser} has invited you to a chat!`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation email.', details: error.message },
        { status: 500 }
      );
    }

    console.log('Resend success response:', data);
    return NextResponse.json(
      { success: true, message: 'Invitation email sent successfully via Resend.' }
    );

  } catch (error) {
    console.error('Failed to process invite request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation due to an server error.', details: errorMessage },
      { status: 500 }
    );
  }
} 