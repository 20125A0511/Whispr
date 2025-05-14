// *** DEPRECATED: This file is no longer used due to Resend conflicts. ***
// *** Please use src/app/api/send-invite-email/route.ts instead. ***
// *** This file is kept for reference only and will be removed in a future update. ***

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase service client
const getSupabaseServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

// Environment variables for Nodemailer
const nodemailerHost = process.env.NODEMAILER_HOST;
const nodemailerPort = process.env.NODEMAILER_PORT ? parseInt(process.env.NODEMAILER_PORT, 10) : 587;
const nodemailerSecure = process.env.NODEMAILER_SECURE === 'true'; // true for 465, false for other ports
const nodemailerUser = process.env.NODEMAILER_USER; // SMTP username
const nodemailerPass = process.env.NODEMAILER_PASS; // SMTP password
const nodemailerFromEmail = process.env.NODEMAILER_FROM_EMAIL; // "From" email address

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

let transporter: nodemailer.Transporter | null = null;

// Basic check for essential configuration
if (!siteUrl) {
  console.error("Error: NEXT_PUBLIC_SITE_URL environment variable is not set.");
}

// Configure Nodemailer transporter
// We'll try to create a test account if no explicit SMTP config is provided
async function initializeTransporter() {
  if (nodemailerHost && nodemailerUser && nodemailerPass && nodemailerFromEmail) {
    console.log("Using provided SMTP configuration for Nodemailer.");
    transporter = nodemailer.createTransport({
      host: nodemailerHost,
      port: nodemailerPort,
      secure: nodemailerSecure,
      auth: {
        user: nodemailerUser,
        pass: nodemailerPass,
      },
    });
  } else {
    console.warn("Warning: SMTP environment variables (NODEMAILER_HOST, NODEMAILER_USER, NODEMAILER_PASS, NODEMAILER_FROM_EMAIL) are not fully set.");
    console.log("Attempting to use Ethereal for email sending (for development/testing).");
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Ethereal test account created successfully:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
      console.log('Host:', testAccount.smtp.host);
      console.log('Port:', testAccount.smtp.port);
      console.log('Secure:', testAccount.smtp.secure);

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      // If using Ethereal, the from email should ideally be the testAccount.user,
      // but we will use NODEMAILER_FROM_EMAIL if set, or fallback to testAccount.user
      if (!nodemailerFromEmail) {
        console.warn(`Warning: NODEMAILER_FROM_EMAIL is not set. Using Ethereal user ${testAccount.user} as sender.`);
      }
    } catch (error) {
      console.error("Error creating Ethereal test account:", error);
      console.error("Email sending will be disabled as no valid transporter could be configured.");
    }
  }
}

initializeTransporter(); // Initialize the transporter on module load

export async function POST(request: Request) {
  if (!transporter || !siteUrl || (!nodemailerFromEmail && !(transporter.options as any)?.auth?.user)) {
    let errorMessage = 'Server configuration error. Email sending is disabled.';
    if (!transporter) errorMessage = 'Email transporter is not configured.';
    else if (!siteUrl) errorMessage = 'NEXT_PUBLIC_SITE_URL is not configured.';
    else if (!nodemailerFromEmail && !(transporter.options as any)?.auth?.user) errorMessage = 'Sender email (NODEMAILER_FROM_EMAIL or Ethereal user) is not configured.';
    
    console.error("Configuration error preventing email sending:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }

  try {
    const { guestEmail, chatId, hostName } = await request.json();

    if (!guestEmail || !chatId || !hostName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: guestEmail, chatId, and hostName' },
        { status: 400 }
      );
    }

    // --- Create chat session in Supabase ---
    const supabase = getSupabaseServiceRoleClient();
    const { error: supabaseError } = await supabase
      .from('chat_sessions')
      .insert({
        chat_id: chatId,
        host_name: hostName,
        // invite_link_used and is_active default to false and true respectively in the DB
      });

    if (supabaseError) {
      console.error('Supabase error creating chat session:', supabaseError);
      return NextResponse.json(
        { success: false, error: 'Failed to create chat session.', details: supabaseError.message },
        { status: 500 }
      );
    }
    // --- End Supabase chat session creation ---

    const chatLink = `${siteUrl}/join/${chatId}`;
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

    // Determine the 'from' email address
    // Prioritize NODEMAILER_FROM_EMAIL, then Ethereal user if available.
    const fromEmail = nodemailerFromEmail || (transporter.options as any)?.auth?.user;

    if (!fromEmail) {
      console.error('Error: Sender email address could not be determined.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Sender email is not configured.' },
        { status: 500 }
      );
    }
    
    const mailOptions = {
      from: `"${invitingUser} (via Whispr)" <${fromEmail}>`,
      to: guestEmail, // Nodemailer accepts a string or an array for 'to'
      subject: `${invitingUser} has invited you to a chat!`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Nodemailer success response: Message sent: %s', info.messageId);
    // For Ethereal, log the preview URL
    if ((transporter.options as any)?.host?.includes('ethereal.email')) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return NextResponse.json(
      { success: true, message: 'Invitation email sent successfully.' }
    );

  } catch (error) {
    console.error('Failed to send email with Nodemailer:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred while sending email.';
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation email.', details: errorMessage },
      { status: 500 }
    );
  }
} 