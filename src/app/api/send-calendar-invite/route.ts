import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { nextActionsService } from '@/services/firebase';
import { NextAction } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate ICS (calendar) file content
function generateICS(action: NextAction): string {
  const startDate = new Date(action.scheduledDate || new Date());
  const endDate = new Date(startDate.getTime() + (action.estimatedDuration || 30) * 60000); // Add duration in minutes
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startDateStr = formatICSDate(startDate);
  const endDateStr = formatICSDate(endDate);
  const nowStr = formatICSDate(new Date());
  
  // Generate unique UID
  const uid = `${action.id}-${Date.now()}@mygtd.app`;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EffectivO//EffectivO App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${action.title}`,
    `DESCRIPTION:${action.description || 'Scheduled next action from EffectivO'}`,
    `LOCATION:${action.context || ''}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    `PRIORITY:5`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionId, userEmails, userId, userEmail } = body;

    // Support both single email (legacy) and multiple emails (new)
    const emailAddresses = userEmails || (userEmail ? [userEmail] : []);

    if (!actionId || !emailAddresses || emailAddresses.length === 0 || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: actionId, userEmails (or userEmail), userId' },
        { status: 400 }
      );
    }

    // Get the next action details
    const actions = await nextActionsService.getNextActions(userId);
    const action = actions.find(a => a.id === actionId);

    if (!action) {
      return NextResponse.json(
        { error: 'Next action not found' },
        { status: 404 }
      );
    }

    if (!action.scheduledDate) {
      return NextResponse.json(
        { error: 'Next action must be scheduled to send calendar invite' },
        { status: 400 }
      );
    }

    // Generate ICS file content
    const icsContent = generateICS(action);
    
    // Create email content
    const emailSubject = `Calendar Invite: ${action.title}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">EffectivO Calendar Invite</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">${action.title}</h3>
          ${action.description ? `<p style="margin: 5px 0; color: #6b7280;">${action.description}</p>` : ''}
          
          <div style="margin: 15px 0;">
            <strong>📅 Scheduled:</strong> ${new Date(action.scheduledDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          <div style="margin: 10px 0;">
            <strong>🕐 Time:</strong> ${new Date(action.scheduledDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </div>
          
          ${action.estimatedDuration ? `
            <div style="margin: 10px 0;">
              <strong>⏱️ Duration:</strong> ${action.estimatedDuration} minutes
            </div>
          ` : ''}
          
          ${action.context ? `
            <div style="margin: 10px 0;">
              <strong>📍 Context:</strong> ${action.context}
            </div>
          ` : ''}
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This calendar invite was generated from your EffectivO app. 
          Accept this invite to block time in your calendar for this next action.
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Sent by EffectivO - Productive & Effective.
        </p>
      </div>
    `;

    // Send email with ICS attachment to all recipients
    const result = await resend.emails.send({
      from: 'EffectivO Calendar <noreply@effectivo.app>',
      to: emailAddresses,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `${action.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
          content: Buffer.from(icsContent, 'utf-8'),
          contentType: 'text/calendar',
        },
      ],
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return NextResponse.json(
        { error: 'Failed to send calendar invite' },
        { status: 500 }
      );
    }

    // Update the next action to mark invite as sent
    await nextActionsService.updateNextAction(userId, actionId, {
      calendarInviteSent: true,
      userEmail: emailAddresses.join(', '), // Store all emails as comma-separated string
    });

    return NextResponse.json({
      success: true,
      message: `Calendar invite sent successfully to ${emailAddresses.length} recipient${emailAddresses.length !== 1 ? 's' : ''}`,
      emailId: result.data?.id,
      recipientCount: emailAddresses.length,
      recipients: emailAddresses,
    });

  } catch (error) {
    console.error('Error sending calendar invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 