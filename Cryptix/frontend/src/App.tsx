import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import MyTickets from './pages/MyTickets';
import Marketplace from './pages/Marketplace';
import ListingDetails from './pages/ListingDetails';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import EventDetails from './pages/EventDetails';
import TicketPurchase from './pages/TicketPurchase';
import Wallet from './pages/Wallet';

function getLibrary(provider: any) {
  return new ethers.providers.Web3Provider(provider);
}

const App: React.FC = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/tickets/purchase/:eventId/:sectionId" element={<TicketPurchase />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ListingDetails />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/wallet" element={<Wallet />} />
      </Routes>
    </Web3ReactProvider>
  );
};

export default App;
