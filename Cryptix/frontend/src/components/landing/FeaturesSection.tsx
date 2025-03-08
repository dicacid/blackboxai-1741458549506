import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  AccountBalanceWallet as WalletIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Gavel as GavelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const features = [
  {
    title: 'NFT-Based Tickets',
    description: 'Unique, non-fungible tokens ensure ticket authenticity and prevent counterfeiting',
    icon: SecurityIcon,
  },
  {
    title: 'Smart Contracts',
    description: 'Automated, transparent, and secure ticket transactions powered by blockchain',
    icon: GavelIcon,
  },
  {
    title: 'Secure Wallet',
    description: 'Multi-signature wallet protection for high-value transactions',
    icon: WalletIcon,
  },
  {
    title: 'Real-time Analytics',
    description: 'Advanced analytics and insights for event organizers and stakeholders',
    icon: AnalyticsIcon,
  },
  {
    title: 'Fast Transfers',
    description: 'Quick and secure ticket transfers with instant verification',
    icon: SpeedIcon,
  },
  {
    title: 'Full Transparency',
    description: 'Complete visibility of ticket history and ownership',
    icon: VisibilityIcon,
  },
];

const FeaturesSection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      id="features"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Why Choose CrypTix?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Our blockchain-powered platform offers unmatched security, transparency, and efficiency
            in festival ticketing
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
                elevation={2}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <feature.icon
                      sx={{
                        fontSize: 48,
                        color: 'primary.main',
                      }}
                    />
                  </Box>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
