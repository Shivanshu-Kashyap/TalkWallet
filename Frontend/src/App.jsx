import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { setUser } from './store/slices/authSlice';
import { useGetProfileQuery } from './store/api';
import socketService from './services/socketService';

// Import pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GroupPage from './pages/GroupPage';
import LoadingSpinner from './components/LoadingSpinner';

const AppContent = () => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const { data: profileData, isLoading } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (profileData?.user) {
      dispatch(setUser(profileData.user));
    }
  }, [profileData, dispatch]);

  useEffect(() => {
    if (token && isAuthenticated) {
      socketService.connect(token);
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [token, isAuthenticated]);

  if (isLoading && token) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/group/:groupId" 
            element={isAuthenticated ? <GroupPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
