export const OG_SIZE = {
    width: 1200,
    height: 630,
};

export const OG_FONTS = [
    {
        name: 'Inter',
        data: null, // We'll load this inside the route handler if needed, or rely on system fonts for simplicity first to ensure speed.
        style: 'normal',
        weight: 700,
    },
];

// Simple SVG Paths for the "Analyst Workbench" concept
export const ICONS = {
    excel: (
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" fill="#1D6F42" />
            <path d="M30 4L40 14H30V4Z" fill="#90D1A6" fillOpacity="0.5" />
            <path d="M14 20H34" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M14 28H34" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M14 36H24" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <rect x="23" y="24" width="16" height="16" rx="2" fill="#107C41" />
            <path d="M27 28L35 36" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M35 28L27 36" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),
    arrow: (
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    shield: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#DCFCE7" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    // Platform Icons (Derived from PlatformIcon.tsx but simplified/sized for OG)
    salesforce: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#00A1E0" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.034C17.494 6.464 14.532 3.5 11 3.5C7.171 3.5 3.991 6.302 3.559 10.036C1.52 10.457 0 12.274 0 14.5C0 16.9853 2.01472 19 4.5 19H17.5Z" />
        </svg>
    ),
    stripe: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#635BFF" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.178 1.108-1.72 2.727-1.72 2.062 0 4.103.743 4.103.743l.568-2.585s-1.886-.774-4.577-.774c-4.137 0-6.19 1.952-6.19 5.38 0 4.298 5.732 4.608 5.732 7.026 0 1.255-1.405 1.89-3.372 1.89-2.71 0-5.145-1.037-5.145-1.037l-.647 2.74s2.217.82 4.972.82c4.326 0 6.648-2.014 6.648-5.38 0-4.639-5.463-4.996-5.463-7.187 0-1.022 1.12-1.611 2.82-1.611 1.703 0 2.946.542 2.946.542l.535 2.528s-1.04.604-2.3 1.05z" />
        </svg>
    ),
    shopify: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#95BF47" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.92 6.62a1 1 0 0 0-.54-.54A17 17 0 0 0 12.33 5a18.64 18.64 0 0 0-4.62.66l-.16.05-.14-1.62a1 1 0 0 0-1.11-.9L3 3.44a1 1 0 0 0-.9 1.11l2 25.13A1 1 0 0 0 5 30h14a1 1 0 0 0 1-.92L22 7.62a1 1 0 0 0-.08-1zM12 20a4 4 0 1 1 4-4 4 4 0 0 1-4 4z" />
        </svg>
    ),
    jira: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#0052CC" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.53 2C6.45 2 2.33 6.12 2.33 11.2c0 5.08 4.12 9.2 9.2 9.2h9.13v-9.2C20.66 6.12 16.54 2 11.53 2zM11.53 17.13c-3.28 0-5.93-2.65-5.93-5.93s2.65-5.93 5.93-5.93 5.93 2.65 5.93 5.93-2.65 5.93-5.93 5.93z" />
        </svg>
    ),
    trello: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#0079BF" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15ZM9.5 5h-4a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-8A.5.5 0 0 0 9.5 5Zm9 0h-4a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5Z" />
        </svg>
    ),
    notion: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.4544 18.8953L9.27788 7.39868L6.84589 7.78864V16.8228L8.71186 17.1328V9.1687L14.4984 19.9882L17.1513 19.5633V8.40866L15.3045 8.0987V17.0628L15.4544 18.8953ZM4.22925 4.19531L6.65719 4.66031C8.05925 4.66031 7.21447 3.59537 17.9392 4.22749L17.2647 5.58046L19.3179 19.2608C19.4828 20.3958 19.7378 20.3008 19.5428 21.1627C19.4633 21.5147 19.1668 21.751 18.8318 21.722L6.15175 19.6641C5.64184 19.5816 5.25338 19.1578 5.22938 18.6404L4.00428 5.20525C3.96678 4.79278 4.22925 4.19531 4.22925 4.19531Z" />
        </svg>
    ),
    asana: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#F06A6A" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#F06A6A" />
            <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2" />
            {/* Using a placeholder for Asana simple aesthetic since I don't have the exact path handy from the other file, but I will use the generic 'json' if needed or just this simple one. Actually let me use a generic 'JSON' file icon if platform not found. */}
        </svg>
    ),
    generic_json: (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2V8H20" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 13H8" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17H8" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 9H8" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
};

export function getPlatformIcon(platformName: string) {
    const key = platformName.toLowerCase();
    // @ts-ignore
    return ICONS[key] || ICONS.generic_json;
}
