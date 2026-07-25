import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_media_kit_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A')
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )

    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#10B981'),
        alignment=TA_RIGHT
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    card_body_style = ParagraphStyle(
        'CardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569')
    )

    tags_style = ParagraphStyle(
        'TagStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#2563EB')
    )

    copy_box_title = ParagraphStyle(
        'CopyBoxTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    copy_box_text = ParagraphStyle(
        'CopyBoxText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # --- HEADER ---
    header_data = [
        [
            Paragraph("<b>JSONExport</b>", title_style),
            Paragraph("OFFICIAL PARTNER MEDIA KIT<br/><b>jsonexport.com</b>", badge_style)
        ],
        [
            Paragraph("Privacy-First Web Utility for Transforming API & SaaS JSON Datasets into Clean Spreadsheets", subtitle_style),
            ""
        ]
    ]

    header_table = Table(header_data, colWidths=[350, 182])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('SPAN', (0,1), (1,1)),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=12))

    # --- EXECUTIVE OVERVIEW ---
    story.append(Paragraph("1. Executive Overview", h2_style))
    overview_text = (
        "<b>JSONExport</b> is a high-performance, browser-native web utility designed for software developers, data analysts, "
        "and e-commerce operators who extract raw API dumps, webhook logs, and SaaS dataset exports. "
        "Our users arrive with immediate <b>data transformation intent</b>: they flatten complex JSON objects into structured Excel/CSV files, "
        "and immediately seek automated tools to sync, analyze, visualize, or store their data."
    )
    story.append(Paragraph(overview_text, body_style))
    story.append(Spacer(1, 10))

    # Key Metrics Table
    metrics_data = [
        [
            Paragraph("<b>Primary Audience</b><br/>Devs, Analysts & Ops", card_body_style),
            Paragraph("<b>Core Intent</b><br/>API Sync & Automation", card_body_style),
            Paragraph("<b>Security Model</b><br/>100% Client-Side", card_body_style),
            Paragraph("<b>Partner Placements</b><br/>Native & Contextual", card_body_style),
        ]
    ]
    metrics_table = Table(metrics_data, colWidths=[133, 133, 133, 133])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 14))

    # --- AUDIENCE PERSONA BREAKDOWN ---
    story.append(Paragraph("2. Audience Breakdown & User Personas", h2_style))
    
    col1_content = [
        Paragraph("Developers & Tech Leads (35%)", card_title_style),
        Spacer(1, 2),
        Paragraph("Processing Stripe webhooks, MongoDB dumps, Jira REST API payloads, and custom backend server logs.", card_body_style),
        Spacer(1, 4),
        Paragraph("Target Tools: Zapier, n8n, Cloud Hosting, Developer APIs", tags_style)
    ]
    
    col2_content = [
        Paragraph("Data & BI Analysts (30%)", card_title_style),
        Spacer(1, 2),
        Paragraph("Converting nested JSON into tabular formats for Excel, Power BI, Google Sheets, and Looker Studio.", card_body_style),
        Spacer(1, 4),
        Paragraph("Target Tools: Coupler.io, Coefficient, Supermetrics", tags_style)
    ]

    col3_content = [
        Paragraph("E-Commerce & CRM Ops (25%)", card_title_style),
        Spacer(1, 2),
        Paragraph("Exporting Shopify order line items, HubSpot contact properties, and Salesforce records for reporting.", card_body_style),
        Spacer(1, 4),
        Paragraph("Target Tools: CRM Connectors, Automated Reporting", tags_style)
    ]

    col4_content = [
        Paragraph("No-Code & Automation Builders (10%)", card_title_style),
        Spacer(1, 2),
        Paragraph("Building automated pipelines to push webhook JSON directly to Notion, Airtable, and Google Sheets.", card_body_style),
        Spacer(1, 4),
        Paragraph("Target Tools: Notion DB, Zapier, Spreadsheet Sync", tags_style)
    ]

    persona_table_data = [
        [col1_content, col2_content],
        [col3_content, col4_content]
    ]

    persona_table = Table(persona_table_data, colWidths=[261, 261])
    persona_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFFFFF')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(persona_table)
    story.append(Spacer(1, 14))

    # --- PARTNER PLACEMENT OPPORTUNITIES ---
    story.append(Paragraph("3. Promotional Placement Opportunities", h2_style))
    opps_data = [
        [
            Paragraph("<b>Post-Conversion Contextual Banners</b>", card_title_style),
            Paragraph("When a user flattens specific datasets (e.g. Shopify, Stripe, HubSpot), a smart contextual prompt recommends partner automation/reporting software.", card_body_style)
        ],
        [
            Paragraph("<b>Sidebar Native Recommendations</b>", card_title_style),
            Paragraph("Persistent, non-intrusive recommendation cards adjacent to the interactive JSON editor for continuous workflow expansion.", card_body_style)
        ],
        [
            Paragraph("<b>Dedicated Integration Guides</b>", card_title_style),
            Paragraph("SEO-optimized technical walkthroughs and converter landing pages demonstrating dataset integration into partner tools.", card_body_style)
        ]
    ]
    opps_table = Table(opps_data, colWidths=[160, 362])
    opps_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(opps_table)
    story.append(Spacer(1, 14))

    # --- IMPACT.COM READY PITCH BOX ---
    story.append(Paragraph("4. Impact.com Application Copy (Ready to Paste)", h2_style))
    copy_text = (
        "\"I run JSONExport (jsonexport.com), a web utility for developers, data analysts, and e-commerce managers "
        "who convert raw API and SaaS JSON exports into Excel/CSV formats. My users frequently process data from platforms like "
        "Shopify, Stripe, HubSpot, and REST APIs, and actively seek tools to automate their data flows and spreadsheets. "
        "I feature partner solutions via contextual recommendations and native partner placements to drive high-converting, targeted signups.\""
    )
    
    copy_box_data = [
        [Paragraph("<b>Copy & Paste into Affiliate Application Forms:</b>", copy_box_title)],
        [Paragraph(copy_text, copy_box_text)]
    ]
    copy_table = Table(copy_box_data, colWidths=[522])
    copy_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#93C5FD')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(copy_table)
    story.append(Spacer(1, 14))

    # --- FOOTER ---
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
    footer_text = Paragraph("© JSONExport (jsonexport.com) • Media & Partner Kit • Prepared for Network & Brand Applications", subtitle_style)
    story.append(footer_text)

    doc.build(story)

if __name__ == '__main__':
    # Save to workspace root and brain artifacts directory
    workspace_pdf = r"c:\Users\HP\Desktop\Personal Websites\json_hub\JSONExport_Media_Kit.pdf"
    artifact_pdf = r"C:\Users\HP\.gemini\antigravity\brain\9cffe817-0f24-4796-9170-316f93dfcf01\JSONExport_Media_Kit.pdf"
    
    create_media_kit_pdf(workspace_pdf)
    create_media_kit_pdf(artifact_pdf)
    print("PDF generated successfully.")
