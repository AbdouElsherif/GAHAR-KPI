import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface KPICardProps {
    title: string;
    icon: string;
    currentValue: number;
    previousValue: number;
    changePercentage: number;
    currentYear: number;
    previousYear: number;
    pieData: any[];
    color?: string;
}

export default function KPICard({
    title,
    icon,
    currentValue,
    previousValue,
    changePercentage,
    currentYear,
    previousYear,
    pieData,
    color = '#0eacb8'
}: KPICardProps) {
    const isPositive = changePercentage >= 0;
    const formattedChange = Math.abs(changePercentage).toFixed(1);

    // Generate shades of the main color for the pie segments
    const COLORS = [
        color,
        `${color}99`, // 60% opacity
        `${color}66`, // 40% opacity
        `${color}33`, // 20% opacity
        `${color}CC`, // 80% opacity
    ];

    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '20px',
            padding: '25px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '280px',
            position: 'relative'
        }}>
            {/* Title & Icon */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                width: '100%',
                justifyContent: 'center'
            }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    color: '#666',
                    fontWeight: '600'
                }}>
                    {title}
                </h3>
            </div>

            {/* Pie Chart Container */}
            <div style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                marginBottom: '20px'
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.8rem'
                            }}
                            itemStyle={{ color: 'var(--text-color)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Centered Number (Overlay) */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 10,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: '#ffffff',
                        lineHeight: '1',
                        fontFamily: 'Segoe UI, sans-serif',
                    }}>
                        {currentValue.toLocaleString('ar-EG')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.95)', marginTop: '5px' }}>
                        {currentYear}
                    </div>
                </div>
            </div>

            {/* Footer: Change & Previous Year */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                width: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: isPositive ? '#28a745' : '#dc3545',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }}>
                    <span>{isPositive ? '⬆' : '⬇'}</span>
                    <span>{formattedChange}%</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#999' }}>
                    مقارنة بـ {previousYear} ({previousValue.toLocaleString('ar-EG')})
                </div>
            </div>
        </div>
    );
}
