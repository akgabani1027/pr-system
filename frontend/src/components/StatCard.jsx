import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-600',
      text: 'text-indigo-600',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-600',
      text: 'text-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-100',
      iconBg: 'bg-amber-600',
      text: 'text-amber-600',
    },
    rose: {
      bg: 'bg-rose-50/70',
      border: 'border-rose-100',
      iconBg: 'bg-rose-600',
      text: 'text-rose-600',
    },
    purple: {
      bg: 'bg-purple-50/70',
      border: 'border-purple-100',
      iconBg: 'bg-purple-600',
      text: 'text-purple-600',
    }
  };

  const currentStyle = colorStyles[color] || colorStyles.indigo;

  return (
    <div className={`p-5 rounded-2xl border bg-white ${currentStyle.border} shadow-sm flex flex-col justify-between hover:shadow transition`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${currentStyle.bg} text-slate-700`}>
            <Icon className={`w-5 h-5 ${currentStyle.text}`} />
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
