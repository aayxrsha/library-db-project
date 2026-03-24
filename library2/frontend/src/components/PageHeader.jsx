export default function PageHeader({ eyebrow, title, subtitle, actions = null }) {
  return (
    <div className="page-header">
      {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
      <div className="page-header-main">
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
