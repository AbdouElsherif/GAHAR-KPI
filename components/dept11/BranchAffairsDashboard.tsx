'use client';

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BranchAffairsReport } from '@/lib/firestore';
import { BRANCH_INDICATORS, BRANCH_PHASES, formatMonthLabel } from './branchAffairsConfig';

interface BranchAffairsDashboardProps {
    reports: BranchAffairsReport[];
    selectedMonth: string;
}

const getIndicatorValue = (indicator: any): number => {
    if (!indicator) return 0;
    if (typeof indicator.value === 'number') return indicator.value;
    return (Number(indicator.visitedFacilities) || 0) + (Number(indicator.accreditationApplicants) || 0);
};

const renderSmartBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === undefined || value === null || value === 0) return null;

    const isTallBar = height >= 72;
    return (
        <text
            x={x + width / 2}
            y={isTallBar ? y + height / 2 : y - 6}
            fill={isTallBar ? '#ffffff' : 'var(--secondary-color)'}
            textAnchor="middle"
            dominantBaseline={isTallBar ? 'middle' : 'auto'}
            fontWeight={700}
            fontSize={12}
        >
            {value}
        </text>
    );
};

const SATISFACTION_IDS = ['patientSatisfactionSurveys', 'providerSatisfactionSurveys'];
const PATIENT_LABEL = 'استبيانات رضاء المرضى';
const PROVIDER_LABEL = 'استبيانات رضاء مقدمي الخدمة';

export default function BranchAffairsDashboard({ reports, selectedMonth }: BranchAffairsDashboardProps) {
    const [selectedPhase, setSelectedPhase] = useState<number | 'all'>('all');
    const [selectedIndicator, setSelectedIndicator] = useState('all');

    const selectedReport = useMemo(() => {
        return reports.find(report => report.month === selectedMonth) || reports[0];
    }, [reports, selectedMonth]);

    const numericIndicators = BRANCH_INDICATORS.filter(indicator => indicator.numeric);
    const selectedIndicatorDef = numericIndicators.find(indicator => indicator.id === selectedIndicator) || numericIndicators[0];
    const selectedIndicatorLabel = selectedIndicator === 'all' ? 'كل المؤشرات' : selectedIndicatorDef.label;

    const branches = useMemo(() => {
        if (!selectedReport) return [];
        return selectedReport.branches.filter(branch => selectedPhase === 'all' || branch.phase === selectedPhase);
    }, [selectedReport, selectedPhase]);

    const getBranchIndicatorValue = (branch: any, indicatorId: string): number => {
        const value = getIndicatorValue(branch.indicators[indicatorId]);
        if (indicatorId === 'patientSatisfactionSurveys' && value === 0) {
            return getIndicatorValue(branch.indicators.customerSatisfactionSurveys);
        }
        return value;
    };

    const summaryCards = useMemo(() => {
        if (!selectedReport) return [];
        return numericIndicators.slice(0, 8).map(indicator => {
            const total = branches.reduce((sum, branch) => sum + getBranchIndicatorValue(branch, indicator.id), 0);
            return { label: indicator.label, total };
        });
    }, [branches, numericIndicators, selectedReport]);

    const buildBranchChartData = (indicator: typeof numericIndicators[number]) => branches.map(branch => ({
            name: branch.branchName,
            value: getBranchIndicatorValue(branch, indicator.id)
        }));

    const buildSatisfactionChartData = () => branches.map(branch => ({
        name: branch.branchName,
        patient: getBranchIndicatorValue(branch, 'patientSatisfactionSurveys'),
        provider: getBranchIndicatorValue(branch, 'providerSatisfactionSurveys')
    }));

    const buildSections = () => {
        if (selectedIndicator !== 'all') {
            if (SATISFACTION_IDS.includes(selectedIndicator)) {
                return [{ type: 'satisfaction' as const, id: 'satisfaction', label: 'استبيانات رضاء المتعاملين' }];
            }

            return [{ type: 'single' as const, id: selectedIndicatorDef.id, indicator: selectedIndicatorDef }];
        }

        const sections: Array<
            | { type: 'single'; id: string; indicator: typeof numericIndicators[number] }
            | { type: 'satisfaction'; id: string; label: string }
        > = [];

        numericIndicators.forEach(indicator => {
            if (indicator.id === 'patientSatisfactionSurveys') {
                sections.push({ type: 'satisfaction', id: 'satisfaction', label: 'استبيانات رضاء المتعاملين' });
                return;
            }
            if (indicator.id === 'providerSatisfactionSurveys') return;
            sections.push({ type: 'single', id: indicator.id, indicator });
        });

        return sections;
    };

    const branchChartData = buildBranchChartData(selectedIndicatorDef);

    const rankedBranches = [...branchChartData].sort((a, b) => b.value - a.value);

    if (!selectedReport) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                لا توجد بيانات متاحة للعرض في لوحة بيانات شئون الفروع.
            </div>
        );
    }

    return (
        <div dir="rtl">
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 8px', color: 'var(--primary-color)' }}>لوحة بيانات شئون الفروع</h2>
                <p style={{ margin: 0, color: '#666' }}>الفترة المعروضة: {formatMonthLabel(selectedReport.month)}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0, minWidth: '220px' }}>
                    <label className="form-label">المرحلة</label>
                    <select
                        className="form-input"
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">كل المراحل</option>
                        {BRANCH_PHASES.map(phase => (
                            <option key={phase.id} value={phase.id}>{phase.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ margin: 0, minWidth: '280px' }}>
                    <label className="form-label">المؤشر</label>
                    <select
                        className="form-input"
                        value={selectedIndicator}
                        onChange={(e) => setSelectedIndicator(e.target.value)}
                    >
                        <option value="all">الكل</option>
                        {numericIndicators.map(indicator => (
                            <option key={indicator.id} value={indicator.id}>{indicator.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '14px',
                marginBottom: '28px'
            }}>
                {summaryCards.map(card => (
                    <div
                        key={card.label}
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderTop: '4px solid var(--primary-color)',
                            borderRadius: '10px',
                            padding: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ color: '#666', fontSize: '0.9rem', minHeight: '42px' }}>{card.label}</div>
                        <div style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.8rem' }}>{card.total}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {buildSections().map(section => {
                    const isSatisfactionSection = section.type === 'satisfaction';
                    const indicatorChartData = isSatisfactionSection
                        ? buildSatisfactionChartData()
                        : selectedIndicator === 'all'
                            ? buildBranchChartData(section.indicator)
                            : branchChartData;
                    const indicatorRanking = [...indicatorChartData]
                        .map((item: any) => ({
                            name: item.name,
                            value: isSatisfactionSection ? (item.patient || 0) + (item.provider || 0) : item.value
                        }))
                        .sort((a, b) => b.value - a.value);
                    const sectionLabel = isSatisfactionSection ? section.label : section.indicator.label;

                    return (
                        <div
                            key={section.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr',
                                gap: '20px',
                                border: selectedIndicator === 'all' ? '1px solid var(--border-color)' : 'none',
                                borderRadius: selectedIndicator === 'all' ? '10px' : 0,
                                padding: selectedIndicator === 'all' ? '16px' : 0
                            }}
                        >
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px' }}>
                                <h3 style={{ margin: '0 0 18px', color: 'var(--secondary-color)' }}>{sectionLabel} حسب الفرع</h3>
                                <div style={{ height: 360 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={indicatorChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={false} />
                                            <Tooltip />
                                            <Legend />
                                            {isSatisfactionSection ? (
                                                <>
                                                    <Bar dataKey="patient" name={PATIENT_LABEL} fill="#0d6a79">
                                                        <LabelList dataKey="patient" content={renderSmartBarLabel} />
                                                    </Bar>
                                                    <Bar dataKey="provider" name={PROVIDER_LABEL} fill="#0eacb8">
                                                        <LabelList dataKey="provider" content={renderSmartBarLabel} />
                                                    </Bar>
                                                </>
                                            ) : (
                                                <Bar dataKey="value" name={sectionLabel} fill="#0d6a79">
                                                    <LabelList dataKey="value" content={renderSmartBarLabel} />
                                                </Bar>
                                            )}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px' }}>
                                <h3 style={{ margin: '0 0 18px', color: 'var(--secondary-color)' }}>ترتيب الفروع</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {indicatorRanking.map((branch, index) => (
                                        <div
                                            key={branch.name}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                backgroundColor: index === 0 ? 'rgba(13,106,121,0.08)' : 'var(--background-color)',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <span style={{ fontWeight: 700 }}>{index + 1}. {branch.name}</span>
                                            <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>{branch.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
