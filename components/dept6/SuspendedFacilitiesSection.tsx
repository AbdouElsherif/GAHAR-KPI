'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';

interface SuspendedFacilities {
    id?: string;
    facilityType: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

interface SuspendedFacilitiesSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

const egyptGovernorates = ['Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©', 'Ø§Ù„Ø¬ÙŠØ²Ø©', 'Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©', 'Ø§Ù„Ø¯Ù‚Ù‡Ù„ÙŠØ©', 'Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±', 'Ø§Ù„Ø¨Ø­ÙŠØ±Ø©', 'Ø§Ù„ÙÙŠÙˆÙ…', 'Ø§Ù„ØºØ±Ø¨ÙŠØ©', 'Ø§Ù„Ø¥Ø³Ù…Ø§Ø¹ÙŠÙ„ÙŠØ©', 'Ø§Ù„Ù…Ù†ÙˆÙÙŠØ©', 'Ø§Ù„Ù…Ù†ÙŠØ§', 'Ø§Ù„Ù‚Ù„ÙŠÙˆØ¨ÙŠØ©', 'Ø§Ù„ÙˆØ§Ø¯ÙŠ Ø§Ù„Ø¬Ø¯ÙŠØ¯', 'Ø§Ù„Ø´Ø±Ù‚ÙŠØ©', 'Ø§Ù„Ø³ÙˆÙŠØ³', 'Ø£Ø³ÙˆØ§Ù†', 'Ø£Ø³ÙŠÙˆØ·', 'Ø¨Ù†ÙŠ Ø³ÙˆÙŠÙ', 'Ø¨ÙˆØ±Ø³Ø¹ÙŠØ¯', 'Ø¯Ù…ÙŠØ§Ø·', 'Ø§Ù„Ø£Ù‚ØµØ±', 'Ø³ÙˆÙ‡Ø§Ø¬', 'Ø¬Ù†ÙˆØ¨ Ø³ÙŠÙ†Ø§Ø¡', 'ÙƒÙØ± Ø§Ù„Ø´ÙŠØ®', 'Ù…Ø·Ø±ÙˆØ­', 'Ù‚Ù†Ø§', 'Ø´Ù…Ø§Ù„ Ø³ÙŠÙ†Ø§Ø¡'];

export default function SuspendedFacilitiesSection({ currentUser, canEdit }: SuspendedFacilitiesSectionProps) {
    const [facilities, setFacilities] = useState<SuspendedFacilities[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({ facilityType: '', facilityName: '', governorate: '', accreditationStatus: '', month: '' });

    const userCanEdit = currentUser && canEdit(currentUser);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        // TODO: Firestore call
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !canEdit(currentUser)) { alert('Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ©'); return; }
        if (!formData.facilityType || !formData.facilityName || !formData.governorate || !formData.accreditationStatus || !formData.month) { alert('ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„'); return; }

        const [year, month] = formData.month.split('-');
        const facilityData = { ...formData, year: parseInt(year), createdBy: currentUser.email, updatedBy: currentUser.email };

        try {
            if (editingId) {
                await loadData(); resetForm(); alert('ØªÙ… Ø§Ù„ØªØ­Ø¯ÙŠØ«');
            } else {
                await loadData(); resetForm(); alert('ØªÙ… Ø§Ù„Ø¥Ø¶Ø§ÙØ©');
            }
        } catch (error) { console.error('Error:', error); alert('Ø­Ø¯Ø« Ø®Ø·Ø£'); }
    };

    const resetForm = () => { setFormData({ facilityType: '', facilityName: '', governorate: '', accreditationStatus: '', month: '' }); setEditingId(null); };
    const handleEdit = (item: SuspendedFacilities) => { setFormData({ facilityType: item.facilityType, facilityName: item.facilityName, governorate: item.governorate, accreditationStatus: item.accreditationStatus, month: item.month }); setEditingId(item.id || null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleDelete = async (id: string) => { if (!currentUser || !canEdit(currentUser)) { alert('Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ©'); return; } if (confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ØŸ')) { await loadData(); alert('ØªÙ… Ø§Ù„Ø­Ø°Ù'); } };

    const exportToExcel = () => {
        const monthNames = ['ÙŠÙ†Ø§ÙŠØ±', 'ÙØ¨Ø±Ø§ÙŠØ±', 'Ù…Ø§Ø±Ø³', 'Ø£Ø¨Ø±ÙŠÙ„', 'Ù…Ø§ÙŠÙˆ', 'ÙŠÙˆÙ†ÙŠÙˆ', 'ÙŠÙˆÙ„ÙŠÙˆ', 'Ø£ØºØ³Ø·Ø³', 'Ø³Ø¨ØªÙ…Ø¨Ø±', 'Ø£ÙƒØªÙˆØ¨Ø±', 'Ù†ÙˆÙÙ…Ø¨Ø±', 'Ø¯ÙŠØ³Ù…Ø¨Ø±'];
        const data = filteredData.map((item, i) => { const [year, month] = item.month.split('-'); return { '#': i + 1, 'Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø©': item.facilityType, 'Ø§Ø³Ù… Ø§Ù„Ù…Ù†Ø´Ø£Ø©': item.facilityName, 'Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©': item.governorate, 'Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯': item.accreditationStatus, 'Ø§Ù„Ø´Ù‡Ø±': `${monthNames[parseInt(month) - 1]} ${year}` }; });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ø§Ù„Ù…Ù†Ø´Ø¢Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©');
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `Ø§Ù„Ù…Ù†Ø´Ø¢Øª_Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['ÙŠÙ†Ø§ÙŠØ±', 'ÙØ¨Ø±Ø§ÙŠØ±', 'Ù…Ø§Ø±Ø³', 'Ø£Ø¨Ø±ÙŠÙ„', 'Ù…Ø§ÙŠÙˆ', 'ÙŠÙˆÙ†ÙŠÙˆ', 'ÙŠÙˆÙ„ÙŠÙˆ', 'Ø£ØºØ³Ø·Ø³', 'Ø³Ø¨ØªÙ…Ø¨Ø±', 'Ø£ÙƒØªÙˆØ¨Ø±', 'Ù†ÙˆÙÙ…Ø¨Ø±', 'Ø¯ÙŠØ³Ù…Ø¨Ø±'];
        const tableRows = filteredData.map((item, i) => { const [year, month] = item.month.split('-'); return new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.facilityType, alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.facilityName, alignment: AlignmentType.RIGHT })], width: { size: 25, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.governorate, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.accreditationStatus, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })] }); });
        const table = new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø©', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'Ø§Ø³Ù… Ø§Ù„Ù…Ù†Ø´Ø£Ø©', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'Ø§Ù„Ø´Ù‡Ø±', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })] }), ...tableRows], width: { size: 100, type: WidthType.PERCENTAGE } });
        const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: 'Ø§Ù„Ù…Ù†Ø´Ø¢Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø®Ù„Ø§Ù„ Ø§Ù„Ø´Ù‡Ø±', alignment: AlignmentType.CENTER, spacing: { after: 200 } }), table] }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        link.download = `Ø§Ù„Ù…Ù†Ø´Ø¢Øª_Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©${filterMonthText}.docx`;
        link.click();
    };

    const filteredData = filterMonth ? facilities.filter(f => f.month === filterMonth) : facilities;
    const formatMonthYear = (month: string) => { const monthNames = ['ÙŠÙ†Ø§ÙŠØ±', 'ÙØ¨Ø±Ø§ÙŠØ±', 'Ù…Ø§Ø±Ø³', 'Ø£Ø¨Ø±ÙŠÙ„', 'Ù…Ø§ÙŠÙˆ', 'ÙŠÙˆÙ†ÙŠÙˆ', 'ÙŠÙˆÙ„ÙŠÙˆ', 'Ø£ØºØ³Ø·Ø³', 'Ø³Ø¨ØªÙ…Ø¨Ø±', 'Ø£ÙƒØªÙˆØ¨Ø±', 'Ù†ÙˆÙÙ…Ø¨Ø±', 'Ø¯ÙŠØ³Ù…Ø¨Ø±']; const [year, monthNum] = month.split('-'); return `${monthNames[parseInt(monthNum) - 1]} ${year}`; };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader title="Ø§Ù„Ù…Ù†Ø´Ø¢Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø®Ù„Ø§Ù„ Ø§Ù„Ø´Ù‡Ø±" icon="âœ…" count={filteredData.length} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>{editingId ? 'ØªØ¹Ø¯ÙŠÙ„' : 'Ø¥Ø¶Ø§ÙØ©'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø© *</label>
                                    <select className="form-input" required value={formData.facilityType} onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}>
                                        <option value="">Ø§Ø®ØªØ±</option><option value="Ù…Ø³ØªØ´ÙÙ‰">Ù…Ø³ØªØ´ÙÙ‰</option><option value="Ù…Ø±ÙƒØ² Ø·Ø¨ÙŠ">Ù…Ø±ÙƒØ² Ø·Ø¨ÙŠ</option><option value="Ù…Ø±ÙƒØ² Ø±Ø¹Ø§ÙŠØ© Ø£ÙˆÙ„ÙŠØ©">Ù…Ø±ÙƒØ² Ø±Ø¹Ø§ÙŠØ© Ø£ÙˆÙ„ÙŠØ©</option><option value="Ø¹ÙŠØ§Ø¯Ø©">Ø¹ÙŠØ§Ø¯Ø©</option><option value="ØµÙŠØ¯Ù„ÙŠØ©">ØµÙŠØ¯Ù„ÙŠØ©</option><option value="Ù…Ø¹Ù…Ù„">Ù…Ø¹Ù…Ù„</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Ø§Ø³Ù… Ø§Ù„Ù…Ù†Ø´Ø£Ø© *</label><input type="text" className="form-input" required value={formData.facilityName} onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })} /></div>
                                <div className="form-group">
                                    <label className="form-label">Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø© *</label>
                                    <select className="form-input" required value={formData.governorate} onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}>
                                        <option value="">Ø§Ø®ØªØ±</option>{egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ *</label>
                                    <select className="form-input" required value={formData.accreditationStatus} onChange={(e) => setFormData({ ...formData, accreditationStatus: e.target.value })}>
                                        <option value="">Ø§Ø®ØªØ±</option><option value="Ù…Ø¹ØªÙ…Ø¯">Ù…Ø¹ØªÙ…Ø¯</option><option value="Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©">Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</option><option value="Ù…Ø±ÙÙˆØ¶">Ù…Ø±ÙÙˆØ¶</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Ø§Ù„Ø´Ù‡Ø± *</label><input type="month" className="form-input" required value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} max={new Date().toISOString().split('T')[0].slice(0, 7)} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>{editingId ? 'ØªØ­Ø¯ÙŠØ«' : 'Ø­ÙØ¸'}</button>
                                {editingId && <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetForm}>Ø¥Ù„ØºØ§Ø¡</ button>}
                            </div>
                        </form>
                    )}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        <MonthFilter value={filterMonth} onChange={setFilterMonth} label="ÙÙ„ØªØ±Ø© Ø­Ø³Ø¨ Ø§Ù„Ø´Ù‡Ø±" minWidth="250px" />
                        <ExportButtons onExportExcel={exportToExcel} onExportWord={exportToWord} show={filteredData.length > 0} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø©</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Ø§Ø³Ù… Ø§Ù„Ù…Ù†Ø´Ø£Ø©</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Ø§Ù„Ø´Ù‡Ø±</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan={userCanEdit ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}><div style={{ fontSize: '2rem', marginBottom: '10px' }}>ðŸ“Š</div>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª</td></tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.facilityType}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{item.facilityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.accreditationStatus}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(item.month)}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleEdit(item)} style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>ØªØ¹Ø¯ÙŠÙ„</button>
                                                        <button onClick={() => handleDelete(item.id!)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Ø­Ø°Ù</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

