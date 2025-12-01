type NavItem = {
  label: string;
  comingSoon?: boolean;
};

const navItems: NavItem[] = [
  { label: "Finance Tracker" },
  { label: "Document Tracker" },
  { label: "Policy Tracker" },
  { label: "Research", comingSoon: true },
  { label: "Content Ideas", comingSoon: true },
];

type NavBarProps = {
  active: string;
  onSelect: (label: string) => void;
};

export function NavBar({ active, onSelect }: NavBarProps) {
  return (
    <header className="nav-bar">
      <div className="brand">
        <div className="brand-mark">MSD</div>
        <div>
          <div className="brand-title">My Smart Desk</div>
          <div className="brand-subtitle">Personal modules in one place</div>
        </div>
      </div>
      <nav className="nav-modules">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-pill ${active === item.label ? "active" : ""} ${
              item.comingSoon ? "muted" : ""
            }`}
            disabled={item.comingSoon}
            onClick={() => onSelect(item.label)}
          >
            <span>{item.label}</span>
            {item.comingSoon && <small className="pill-badge">Soon</small>}
          </button>
        ))}
      </nav>
    </header>
  );
}
