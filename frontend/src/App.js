// frontend\src\App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Goal from './components/Goal';
import WhyUs from './components/WhyUs';
import Quotes from './components/Quotes';
import News from './components/News';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Account from './pages/Account/Account';
import BusinessAccount from './pages/BusinessAccount/BusinessAccount';
import AllNews from './pages/AllNews/AllNews';
import Restaurants from './pages/Restaurants/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail/RestaurantDetail';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import Cart from './pages/Cart/Cart';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

const UserRoute = ({ children }) => {
  const { user } = useAuth();
  return user && user.role !== 'admin' ? children : <Navigate to="/" replace />;
};

const BusinessRoute = ({ children }) => {
  const { user, isBusiness } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isBusiness()) {
    return <Navigate to="/account" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const LayoutWithNavbarFooter = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
};

const AccountContextWrapper = ({ children }) => {
  return (
    <AccountProvider>
      {children}
    </AccountProvider>
  );
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && user.role === 'user' && <Cart />}
      
      <Routes>
        <Route path="/" element={
          <LayoutWithNavbarFooter>
            <div id="main">
              <Hero />
            </div>
            <div id="about">
              <Goal />
            </div>
            <div id="whyus">
              <WhyUs />
            </div>
            <Quotes />
            <div id="catalog">
              <News /> 
            </div>
            <FAQ />
            <Contact />
          </LayoutWithNavbarFooter>
        } />
        
        <Route path="/restaurants" element={
          <LayoutWithNavbarFooter>
            <Restaurants />
          </LayoutWithNavbarFooter>
        } />
        
        <Route path="/restaurant/:id" element={
          <LayoutWithNavbarFooter>
            <RestaurantDetail />
          </LayoutWithNavbarFooter>
        } />
        
        <Route path="/all-news" element={
          <LayoutWithNavbarFooter>
            <AllNews />
          </LayoutWithNavbarFooter>
        } />
        
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        
        <Route path="/account" element={
          <UserRoute>
            <AccountContextWrapper>
              <LayoutWithNavbarFooter>
                <Account />
              </LayoutWithNavbarFooter>
            </AccountContextWrapper>
          </UserRoute>
        } />
        
        <Route path="/business" element={
          <BusinessRoute>
            <AccountContextWrapper>
              <LayoutWithNavbarFooter>
                <BusinessAccount />
              </LayoutWithNavbarFooter>
            </AccountContextWrapper>
          </BusinessRoute>
        } />

        <Route path="/business-account" element={
          <BusinessRoute>
            <AccountContextWrapper>
              <LayoutWithNavbarFooter>
                <BusinessAccount />
              </LayoutWithNavbarFooter>
            </AccountContextWrapper>
          </BusinessRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute>
            <AccountContextWrapper>
              <AdminPanel />
            </AccountContextWrapper>
          </AdminRoute>
        } />

        <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;