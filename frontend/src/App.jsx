import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import PhotoViewer from './pages/PhotoViewer';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import UploadDemo from './pages/UploadDemo';
import Navbar from './components/Navbar';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        localStorage.setItem('supabase_token', session.access_token);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        localStorage.setItem('supabase_token', session.access_token);
      } else {
        localStorage.removeItem('supabase_token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // Let Landing page handle loading
  }

  return (
    <Router>
      <Routes>
        {/* Photo viewer - accessible to all but requires login */}
        <Route path="/photo/:photoId" element={<PhotoViewer />} />
        
        {/* Non-authenticated routes */}
        {!user && (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login supabase={supabase} />} />
            <Route path="/signup" element={<Signup supabase={supabase} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
        
        {/* Authenticated routes */}
        {user && (
          <>
            <Route path="/dashboard" element={
              <>
                <Navbar user={user} supabase={supabase} />
                <div className="container">
                  <Dashboard user={user} />
                </div>
              </>
            } />
            <Route path="/admin" element={
              <>
                <Navbar user={user} supabase={supabase} />
                <div className="container">
                  <Admin user={user} />
                </div>
              </>
            } />
            <Route path="/groups" element={
              <>
                <Navbar user={user} supabase={supabase} />
                <div className="container">
                  <Groups />
                </div>
              </>
            } />
            <Route path="/groups/:groupId" element={
              <>
                <Navbar user={user} supabase={supabase} />
                <div className="container">
                  <GroupDetail />
                </div>
              </>
            } />
            <Route path="/upload-demo" element={
              <>
                <Navbar user={user} supabase={supabase} />
                <div className="container">
                  <UploadDemo />
                </div>
              </>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;