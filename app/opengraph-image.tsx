import { ImageResponse } from 'next/og';
import { ICONS, OG_SIZE } from '@/lib/og-utils';

export const runtime = 'edge';
export const alt = 'JsonExport - Free JSON to Excel Converter';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F8FAFC', // Slate-50 (Very light gray)
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Main Content Container */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '60px',
                        marginBottom: '60px',
                    }}
                >
                    {/* Source: JSON */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {ICONS.generic_json}
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#334155' }}>JSON Data</div>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', paddingBottom: '30px' }}>
                        {ICONS.arrow}
                    </div>

                    {/* Target: Excel */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {ICONS.excel}
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#107C41' }}>Excel / CSV</div>
                    </div>
                </div>

                {/* Typography */}
                <h1
                    style={{
                        fontSize: 80,
                        fontWeight: 900,
                        color: '#0f172a', // Slate-900
                        margin: 0,
                        letterSpacing: '-0.03em',
                        textAlign: 'center',
                        lineHeight: 1.1,
                    }}
                >
                    JsonExport
                </h1>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '20px',
                        padding: '12px 24px',
                        background: '#fff',
                        borderRadius: '50px',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {ICONS.shield}
                    <span style={{ fontSize: 28, color: '#475569', fontWeight: 600 }}>
                        No Code. 100% Private. Instant.
                    </span>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
