import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'test-data');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// --- Helpers ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

const PRODUCTS = ['T-Shirt', 'Jeans', 'Sneakers', 'Hat', 'Socks', 'Jacket', 'Watch', 'Belt', 'Scarf', 'Gloves'];
const CITIES = ['New York', 'London', 'Berlin', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'Singapore'];
const STATUSES = ['pending', 'paid', 'fulfilled', 'restocked', 'refunded'];
const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

// --- Generators ---

// 1. Shopify Order Generator
const generateShopifyOrder = (id: number) => {
    const itemCount = getRandomInt(1, 8);
    const line_items = Array.from({ length: itemCount }, (_, i) => ({
        id: 800000000 + id * 100 + i,
        variant_id: 40000000 + getRandomInt(1, 9999),
        title: getRandomElement(PRODUCTS),
        quantity: getRandomInt(1, 5),
        price: (Math.random() * 100).toFixed(2),
        sku: `SKU-${getRandomInt(1000, 9999)}`,
        vendor: "FashionNovaClone",
        fulfillment_service: "manual",
        product_id: 600000000 + getRandomInt(1, 500),
        requires_shipping: true,
        taxable: true,
        gift_card: false,
        name: getRandomElement(PRODUCTS),
        variant_inventory_management: "shopify",
        properties: [],
        product_exists: true,
        fulfillable_quantity: getRandomInt(1, 5),
        grams: getRandomInt(100, 500),
        tax_lines: [
            {
                title: "VAT",
                price: (Math.random() * 10).toFixed(2),
                rate: 0.2
            }
        ]
    }));

    return {
        id: 4000000000 + id,
        email: `customer${id}@example.com`,
        closed_at: null,
        created_at: getRandomDate(new Date(2023, 0, 1), new Date()),
        updated_at: getRandomDate(new Date(2023, 0, 1), new Date()),
        number: id,
        note: Math.random() > 0.8 ? "Please leave at front door" : null,
        token: `token_${id}`,
        gateway: "shopify_payments",
        test: false,
        total_price: line_items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0).toFixed(2),
        subtotal_price: line_items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0).toFixed(2),
        total_weight: line_items.reduce((acc, item) => acc + item.grams, 0),
        total_tax: "0.00",
        taxes_included: false,
        currency: "USD",
        financial_status: getRandomElement(STATUSES),
        confirmed: true,
        total_discounts: "0.00",
        total_line_items_price: "0.00",
        cart_token: `cart_${id}`,
        buyer_accepts_marketing: true,
        name: `#100${id}`,
        referring_site: "google.com",
        landing_site: "/",
        cancelled_at: null,
        cancel_reason: null,
        total_price_usd: "0.00",
        checkout_token: `checkout_${id}`,
        reference: null,
        user_id: null,
        location_id: null,
        source_identifier: null,
        source_url: null,
        processed_at: getRandomDate(new Date(2023, 0, 1), new Date()),
        device_id: null,
        phone: null,
        customer: {
            id: 500000000 + id,
            email: `customer${id}@example.com`,
            accepts_marketing: true,
            created_at: getRandomDate(new Date(2022, 0, 1), new Date()),
            updated_at: getRandomDate(new Date(2023, 0, 1), new Date()),
            first_name: "John",
            last_name: `Doe ${id}`,
            orders_count: getRandomInt(1, 10),
            state: "disabled",
            total_spent: "0.00",
            last_order_id: null,
            note: null,
            verified_email: true,
            multipass_identifier: null,
            tax_exempt: false,
            tags: "VIP",
            last_order_name: null,
            currency: "USD",
            phone: "+15555555555",
            addresses: [
                {
                    id: 600000000 + id,
                    customer_id: 500000000 + id,
                    first_name: "John",
                    last_name: `Doe ${id}`,
                    company: null,
                    address1: `${getRandomInt(1, 999)} Main St`,
                    address2: "",
                    city: getRandomElement(CITIES),
                    province: "NY",
                    country: "United States",
                    zip: "10001",
                    phone: "+15555555555",
                    name: `John Doe ${id}`,
                    province_code: "NY",
                    country_code: "US",
                    country_name: "United States",
                    default: true
                }
            ],
            accepts_marketing_updated_at: getRandomDate(new Date(2022, 0, 1), new Date()),
            marketing_opt_in_level: null,
            tax_exemptions: [],
            admin_graphql_api_id: `gid://shopify/Customer/${500000000 + id}`,
            default_address: {
                id: 600000000 + id,
                customer_id: 500000000 + id,
                first_name: "John",
                last_name: `Doe ${id}`,
                company: null,
                address1: `${getRandomInt(1, 999)} Main St`,
                address2: "",
                city: getRandomElement(CITIES),
                province: "NY",
                country: "United States",
                zip: "10001",
                phone: "+15555555555",
                name: `John Doe ${id}`,
                province_code: "NY",
                country_code: "US",
                country_name: "United States",
                default: true
            }
        },
        line_items: line_items
    };
};

// 2. Jira Issue Generator
const generateJiraIssue = (id: number) => {
    const commentCount = getRandomInt(0, 5);
    const comments = Array.from({ length: commentCount }, (_, i) => ({
        self: `https://jira.example.com/rest/api/2/issue/${10000 + id}/comment/${20000 + i}`,
        id: `${20000 + i}`,
        author: {
            self: "https://jira.example.com/rest/api/2/user?username=fred",
            name: "fred",
            key: "fred",
            emailAddress: "fred@example.com",
            avatarUrls: {
                "48x48": "https://jira.example.com/secure/useravatar?size=large&ownerId=fred",
                "24x24": "https://jira.example.com/secure/useravatar?size=small&ownerId=fred",
                "16x16": "https://jira.example.com/secure/useravatar?size=xsmall&ownerId=fred",
                "32x32": "https://jira.example.com/secure/useravatar?size=medium&ownerId=fred"
            },
            displayName: "Fred F. User",
            active: true,
            timeZone: "Australia/Sydney"
        },
        body: LOREM.slice(0, getRandomInt(50, LOREM.length)),
        updateAuthor: {
            self: "https://jira.example.com/rest/api/2/user?username=fred",
            name: "fred",
            key: "fred",
            emailAddress: "fred@example.com",
            displayName: "Fred F. User",
            active: true,
            timeZone: "Australia/Sydney"
        },
        created: getRandomDate(new Date(2023, 0, 1), new Date()),
        updated: getRandomDate(new Date(2023, 0, 1), new Date())
    }));

    return {
        expand: "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
        id: `${10000 + id}`,
        self: `https://jira.example.com/rest/api/2/issue/${10000 + id}`,
        key: `PROJ-${id}`,
        fields: {
            summary: `Issue summary for ticket ${id}`,
            issuetype: {
                self: "https://jira.example.com/rest/api/2/issuetype/10000",
                id: "10000",
                description: "A task that needs to be done.",
                iconUrl: "https://jira.example.com/secure/viewavatar?size=xsmall&avatarId=10318&avatarType=issuetype",
                name: getRandomElement(["Task", "Bug", "Story", "Epic"]),
                subtask: false,
                avatarId: 10318
            },
            timespent: getRandomInt(0, 36000),
            project: {
                self: "https://jira.example.com/rest/api/2/project/10000",
                id: "10000",
                key: "PROJ",
                name: "Example Project",
                projectTypeKey: "software",
                avatarUrls: {
                    "48x48": "https://jira.example.com/secure/projectavatar?pid=10000&avatarId=10011",
                    "24x24": "https://jira.example.com/secure/projectavatar?pid=10000&avatarId=10011",
                    "16x16": "https://jira.example.com/secure/projectavatar?pid=10000&avatarId=10011",
                    "32x32": "https://jira.example.com/secure/projectavatar?pid=10000&avatarId=10011"
                }
            },
            fixVersions: [],
            aggregatetimespent: null,
            resolution: null,
            customfield_1001: getRandomElement(["Option A", "Option B", "Option C"]),
            customfield_1002: Math.random() > 0.5 ? "Yes" : "No",
            resolutiondate: null,
            workratio: -1,
            lastViewed: null,
            watches: {
                self: `https://jira.example.com/rest/api/2/issue/PROJ-${id}/watchers`,
                watchCount: getRandomInt(0, 10),
                isWatching: false
            },
            created: getRandomDate(new Date(2023, 0, 1), new Date()),
            priority: {
                self: "https://jira.example.com/rest/api/2/priority/3",
                iconUrl: "https://jira.example.com/images/icons/priorities/major.svg",
                name: getRandomElement(["Blocker", "Critical", "Major", "Minor", "Trivial"]),
                id: "3"
            },
            labels: getRandomInt(0, 5) > 0 ? ["frontend", "backend", "ui", "api"].slice(0, getRandomInt(0, 3)) : [],
            timeestimate: null,
            aggregatetimeoriginalestimate: null,
            versions: [],
            issuelinks: [],
            assignee: {
                self: "https://jira.example.com/rest/api/2/user?username=jdoe",
                name: "jdoe",
                key: "jdoe",
                emailAddress: "jdoe@example.com",
                displayName: "John Doe",
                active: true,
                timeZone: "America/New_York"
            },
            updated: getRandomDate(new Date(2023, 0, 1), new Date()),
            status: {
                self: "https://jira.example.com/rest/api/2/status/10000",
                description: "",
                iconUrl: "https://jira.example.com/images/icons/statuses/open.png",
                name: getRandomElement(["Open", "In Progress", "Done", "Reopened"]),
                id: "10000",
                statusCategory: {
                    self: "https://jira.example.com/rest/api/2/statuscategory/2",
                    id: 2,
                    key: "new",
                    colorName: "blue-gray",
                    name: "To Do"
                }
            },
            components: [],
            timeoriginalestimate: null,
            description: LOREM.repeat(getRandomInt(1, 4)),
            timetracking: {},
            attachment: [],
            aggregatetimeestimate: null,
            summary_text: `Issue summary for ticket ${id}`,
            creator: {
                self: "https://jira.example.com/rest/api/2/user?username=admin",
                name: "admin",
                key: "admin",
                emailAddress: "admin@example.com",
                displayName: "Administrator",
                active: true,
                timeZone: "Australia/Sydney"
            },
            subtasks: [],
            reporter: {
                self: "https://jira.example.com/rest/api/2/user?username=admin",
                name: "admin",
                key: "admin",
                emailAddress: "admin@example.com",
                displayName: "Administrator",
                active: true,
                timeZone: "Australia/Sydney"
            },
            customfield_10000: "{}",
            aggregateprogress: {
                progress: 0,
                total: 0
            },
            environment: null,
            duedate: null,
            progress: {
                progress: 0,
                total: 0
            },
            comment: {
                comments: comments,
                maxResults: 50,
                total: comments.length,
                startAt: 0
            },
            votes: {
                self: `https://jira.example.com/rest/api/2/issue/PROJ-${id}/votes`,
                votes: getRandomInt(0, 5),
                hasVoted: false
            }
        }
    };
};

// 3. MongoDB Log Generator
const generateMongoLog = (id: number) => {
    // Polymorphic payload
    const payloadTypes = [
        { action: "login", ip: `192.168.1.${getRandomInt(1, 255)}`, device: "mobile" },
        { action: "view_item", itemId: `ITEM-${getRandomInt(100, 999)}`, duration: getRandomInt(10, 300) },
        { action: "purchase", amount: (Math.random() * 200).toFixed(2), currency: "USD" },
        { action: "error", code: 500, message: "Internal Server Error", stack: "Error at func..." }
    ];

    return {
        _id: { "$oid": `65a${id.toString(16).padStart(21, '0')}` },
        timestamp: { "$date": getRandomDate(new Date(2023, 0, 1), new Date()) },
        level: getRandomElement(["INFO", "WARN", "ERROR", "DEBUG"]),
        service: getRandomElement(["auth-service", "order-service", "payment-gateway", "frontend"]),
        metadata: {
            user_id: getRandomInt(1, 10000),
            session_id: `sess_${id}`,
            region: getRandomElement(["us-east-1", "eu-west-1", "ap-southeast-2"])
        },
        payload: getRandomElement(payloadTypes),
        v: 1
    };
};

// --- Execution ---

async function writeToFile(filename: string, generator: (id: number) => any, count: number) {
    const filePath = path.join(OUTPUT_DIR, filename);
    const stream = fs.createWriteStream(filePath);

    stream.write('[\n');
    console.log(`Generating ${filename} with ${count} records...`);

    let i = 0;
    while (i < count) {
        if (!stream.write((i === 0 ? '' : ',\n') + JSON.stringify(generator(i), null, 2))) {
            await new Promise<void>(resolve => stream.once('drain', () => resolve()));
        }
        i++;
        if (i % 1000 === 0) process.stdout.write('.');
    }

    stream.write('\n]');
    stream.end();
    console.log(`\nFinished ${filename}.`);
}

async function main() {
    // 1. Shopify orders (~50MB -> ~15,000 records approx)
    await writeToFile('shopify_orders.json', generateShopifyOrder, 15000);

    // 2. Jira issues (~20MB -> ~5,000 records approx)
    await writeToFile('jira_issues.json', generateJiraIssue, 5000);

    // 3. Mongo logs (~50MB -> ~100,000 records approx)
    await writeToFile('mongodb_logs.json', generateMongoLog, 100000);
}

main().catch(console.error);
