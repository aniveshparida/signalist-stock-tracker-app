import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    WATCHLIST_DIGEST_EMAIL_TEMPLATE
} from "@/lib/nodemailer/templates";

const APP_DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stock-market-dev.vercel.app/';

type WelcomeEmailPayload = {
    email: string;
    name: string;
    intro: string;
};

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailPayload) => {
    const introBlock = `<p class="mobile-text dark-text-secondary" style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">${intro}</p>`;
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', introBlock);

    await transporter.sendMail({
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: 'Welcome to Signalist 🚀',
        html: htmlTemplate,
    });
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist News" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendWatchlistDigestEmail = async (
    { email, name, watchlist }: { email: string; name: string; watchlist: { symbol: string; company: string; addedAt?: string }[] }
) => {
    const rows = watchlist
        .map((item) => {
            const addedAt = item.addedAt
                ? new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—';
            return `<tr>
                <td style="font-weight:600;">${item.symbol}</td>
                <td>${item.company || item.symbol}</td>
                <td style="color:#9CA3AF;">${addedAt}</td>
            </tr>`;
        })
        .join('');

    const watchlistContent = watchlist.length
        ? `<table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Company</th>
                        <th>Added</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`
        : `<div class="empty">Your watchlist is empty. Add a few symbols to receive richer summaries.</div>`;

    const htmlTemplate = WATCHLIST_DIGEST_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{date}}', new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
        .replace(/{{dashboardUrl}}/g, APP_DASHBOARD_URL)
        .replace('{{watchlistContent}}', watchlistContent);

    await transporter.sendMail({
        from: `"Signalist Watchlist" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: '📊 Your Daily Watchlist Summary',
        html: htmlTemplate,
    });
}