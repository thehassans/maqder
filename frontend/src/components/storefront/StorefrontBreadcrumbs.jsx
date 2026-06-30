import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function StorefrontBreadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav style={{ padding: '14px 0', fontSize: '13px', color: '#6b7280' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', padding: 0, margin: 0, flexWrap: 'wrap' }}>
        <li>
          <Link to="/store" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
            <Home size={14} /> Home
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <React.Fragment key={i}>
              <li><ChevronRight size={14} style={{ color: '#d1d5db' }} /></li>
              <li>
                {item.href && !isLast ? (
                  <Link to={item.href} style={{ color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>{item.label}</Link>
                ) : (
                  <span style={{ color: '#111827', fontWeight: 700 }}>{item.label}</span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
