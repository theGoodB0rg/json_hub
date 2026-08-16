export async function verifyLicense(licenseKey: string) {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            product_permalink: "json_hub", // Use an appropriate permalink here
            license_key: licenseKey,
        }),
    });
    return response.json();
}
