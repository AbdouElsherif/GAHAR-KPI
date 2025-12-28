#!/usr/bin/env python3
"""
Script to add Additional Activities JSX section to all remaining dashboard components
"""

import re

ADDITIONAL_ACTIVITIES_JSX = '''
            {/* قسم الأنشطة الإضافية - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && currentAdditionalActivities && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #6f42c1',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '15px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #6f42c1'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🎯</span>
                            <h3 style={{
                                margin: 0,
                                color: '#4a2c7a',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                أنشطة إضافية - {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear}
                            </h3>
                        </div>
                        <div style={{
                            backgroundColor: '#e8d9f5',
                            padding: '20px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: '#4a2c7a',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {currentAdditionalActivities}
                        </div>
                    </div>
                </div>
            )}'''

dashboards = [
    'd:/تطبيقي/components/TechnicalSupportDashboard.tsx',
    'd:/تطبيقي/components/CustomerSatisfactionDashboard.tsx',
    'd:/تطبيقي/components/TechnicalClinicalDashboard.tsx',
    'd:/تطبيقي/components/AdminAuditDashboard.tsx',
    'd:/تطبيقي/components/MedicalProfessionalsDashboard.tsx',
]

for dashboard_path in dashboards:
    try:
        with open(dashboard_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the last occurrence of the development proposals section closing
        # We want to add our section right before the final </div> closing tag
        
        # Pattern to find: the closing of development proposals  section followed by </div> and closing parenthesis
        pattern = r'(\s+\)\}\s+</div>\s+\);\s+}\s*$)'
        
        if re.search(pattern, content):
            # Insert before the final closing
            replacement = ADDITIONAL_ACTIVITIES_JSX + r'\1'
            new_content = re.sub(pattern, replacement, content)
            
            with open(dashboard_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✓ Updated {dashboard_path}")
        else:
            print(f"✗ Pattern not found in {dashboard_path}")
            
    except Exception as e:
        print(f"✗ Error processing {dashboard_path}: {e}")

print("\n✓ All dashboards updated successfully!")
