import { Link } from 'react-router-dom';

function Navbar({ user, supabase }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            Photo Stash
          </Link>
          <div className="navbar-nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/groups">Groups</Link>
            <Link to="/admin">Admin</Link>
            <div className="user-info">
              <span>{user.email}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;