import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import LandingLayout from '../components/landing/LandingLayout';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import AboutSection from '../components/landing/AboutSection';
import ContactSection from '../components/landing/ContactSection';

const Landing: React.FC = () => {
  return (
    <Router>
      <LandingLayout>
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
        <ContactSection />
      </LandingLayout>
    </Router>
  );
};

export default Landing;
