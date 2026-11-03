import React, { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X, MoreHorizontal, Pencil, Plus, ChevronDown } from 'lucide-react';

const CONTROL_HEIGHT = 36;

const baseControl: React.CSSProperties = {
  height: CONTROL_HEIGHT,
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  backgroundColor: '#FFFFFF',
  fontSize: 13,
  color: '#1F2937',
  fontFamily: 'inherit',
};

/** Hook: cierra un menú al hacer clic fuera */
const useClickOutside = (onClose: () => void) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
};

export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

const MenuPanel: React.FC<{ items: MenuItem[]; onClose: () => void; align?: 'left' | 'right' }> = ({ items, onClose, align = 'right' }) => (
  <div
    style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      [align]: 0,
      minWidth: 210,
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      boxShadow: '0 10px 25px rgba(15,23,42,0.12)',
      padding: 4,
      zIndex: 60,
    } as React.CSSProperties}
  >
    {items.filter(i => !i.hidden).map((item, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => {
          onClose();
          item.onClick();
        }}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '8px 12px',
          border: 'none',
          background: 'transparent',
          borderRadius: 6,
          fontSize: 13,
          cursor: 'pointer',
          color: item.danger ? '#DC2626' : '#1F2937',
          fontWeight: 500,
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = item.danger ? '#FEF2F2' : '#F3F4F6')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {item.label}
      </button>
    ))}
  </div>
);

/** Cabecera de acciones: un botón principal + menú "Más acciones" */
export const HeaderActions: React.FC<{
  primaryLabel?: string;
  onPrimary?: () => void;
  items: MenuItem[];
}> = ({ primaryLabel, onPrimary, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{ ...baseControl, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Más acciones <ChevronDown size={14} />
        </button>
        {open && <MenuPanel items={items} onClose={() => setOpen(false)} />}
      </div>
      {primaryLabel && onPrimary && (
        <button
          type="button"
          onClick={onPrimary}
          style={{
            height: CONTROL_HEIGHT,
            padding: '0 16px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#2E5339',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={16} /> {primaryLabel}
        </button>
      )}
    </div>
  );
};

/** Acciones por fila: ícono de editar + menú de tres puntos */
export const RowActions: React.FC<{ onEdit: () => void; menu: MenuItem[] }> = ({ onEdit, menu }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const iconBtn: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };
  return (
    <div className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button type="button" title="Editar" onClick={onEdit} style={iconBtn}>
        <Pencil size={15} color="#2563EB" />
      </button>
      <div ref={ref} style={{ position: 'relative' }}>
        <button type="button" title="Más opciones" onClick={() => setOpen(o => !o)} style={iconBtn}>
          <MoreHorizontal size={16} color="#4B5563" />
        </button>
        {open && <MenuPanel items={menu} onClose={() => setOpen(false)} align="right" />}
      </div>
    </div>
  );
};

/** Celda de nombre: código chico, nombre (máx. 2 líneas) y etiquetas sin repetir */
export const NameCell: React.FC<{
  code?: string;
  name: string;
  tags?: (string | undefined)[];
  suspended?: boolean;
}> = ({ code, name, tags = [], suspended }) => {
  const uniqueTags = Array.from(new Set(tags.filter((t): t is string => Boolean(t && t.trim()))));
  return (
    <div style={{ textAlign: 'left', minWidth: 220, maxWidth: 420 }}>
      {code && (
        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: 0.2 }}>
          {code}
        </div>
      )}
      <div
        title={name}
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: '#111827',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {name}
      </div>
      {(uniqueTags.length > 0 || suspended) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {uniqueTags.map(t => (
            <span key={t} style={{ fontSize: 10.5, padding: '1px 8px', borderRadius: 999, backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 600 }}>
              {t}
            </span>
          ))}
          {suspended && (
            <span style={{ fontSize: 10.5, padding: '1px 8px', borderRadius: 999, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
              Suspendido
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  emptyValue: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  primary?: boolean;
}

/** Barra de filtros: buscador + filtros principales + "Más filtros" + chips activos */
export const FilterBar: React.FC<{
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  filters: FilterDef[];
  resultsLabel?: React.ReactNode;
  extra?: React.ReactNode;
}> = ({ search, onSearch, placeholder, filters, resultsLabel, extra }) => {
  const [showMore, setShowMore] = useState(false);
  const primary = filters.filter(f => f.primary);
  const secondary = filters.filter(f => !f.primary);
  const active = filters.filter(f => f.value !== f.emptyValue);
  const secondaryActive = secondary.filter(f => f.value !== f.emptyValue).length;

  const renderSelect = (f: FilterDef) => (
    <select
      key={f.key}
      value={f.value}
      onChange={e => f.onChange(e.target.value)}
      aria-label={f.label}
      style={{
        ...baseControl,
        padding: '0 10px',
        minWidth: 150,
        maxWidth: 230,
        borderColor: f.value !== f.emptyValue ? '#2E5339' : '#D1D5DB',
        fontWeight: f.value !== f.emptyValue ? 600 : 400,
      }}
    >
      <option value={f.emptyValue}>{f.label}</option>
      {f.options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  return (
    <div className="no-print" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
          <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={placeholder}
            style={{ ...baseControl, width: '100%', paddingLeft: 32, paddingRight: 10 }}
          />
        </div>
        {primary.map(renderSelect)}
        {secondary.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMore(s => !s)}
            style={{
              ...baseControl,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontWeight: 600,
              backgroundColor: showMore ? '#F3F4F6' : '#FFFFFF',
            }}
          >
            <SlidersHorizontal size={14} /> Más filtros{secondaryActive > 0 ? ` (${secondaryActive})` : ''}
          </button>
        )}
        {extra}
      </div>

      {showMore && secondary.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
          {secondary.map(renderSelect)}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8, minHeight: 24 }}>
        {resultsLabel && <span style={{ fontSize: 12, color: '#6B7280', marginRight: 6 }}>{resultsLabel}</span>}
        {active.map(f => {
          const optLabel = f.options.find(o => o.value === f.value)?.label || f.value;
          return (
            <span
              key={f.key}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, padding: '2px 4px 2px 10px', borderRadius: 999, backgroundColor: '#E9EFEA', color: '#2E5339', fontWeight: 600 }}
            >
              {optLabel.replace(/^—\s*/, '')}
              <button
                type="button"
                onClick={() => f.onChange(f.emptyValue)}
                aria-label={`Quitar filtro ${f.label}`}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 2, color: '#2E5339' }}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        {(active.length > 0 || search) && (
          <button
            type="button"
            onClick={() => {
              onSearch('');
              filters.forEach(f => f.onChange(f.emptyValue));
            }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#6B7280', textDecoration: 'underline' }}
          >
            Limpiar todo
          </button>
        )}
      </div>
    </div>
  );
};
