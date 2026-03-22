import NavBar from './NavBar';

function Shell({ children, auth, onAuthChange }) {
  return (
    <div className="site-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <NavBar auth={auth} onAuthChange={onAuthChange} />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default Shell;
