import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Lightbulb as VisionIcon,
  Flag as MissionIcon,
} from '@mui/icons-material';

const AboutSection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.grey[50],
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
            About CrypTix
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Transforming the festival ticketing experience through blockchain innovation
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[4],
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VisionIcon
                  sx={{ fontSize: 40, color: 'primary.main', mr: 2 }}
                />
                <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                  Our Vision
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                To create a decentralized ticketing platform that eliminates fraud,
                enhances user experience, and revolutionizes how people buy, sell,
                and trade festival tickets.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[4],
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MissionIcon
                  sx={{ fontSize: 40, color: 'primary.main', mr: 2 }}
                />
                <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                  Our Mission
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                To empower festival organizers and attendees through innovative
                blockchain technology, providing a secure, transparent, and
                efficient ticketing solution.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[4],
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon
                  sx={{ fontSize: 40, color: 'primary.main', mr: 2 }}
                />
                <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                  Our Impact
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                By leveraging blockchain technology and smart contracts, we're
                creating a trustless ecosystem that benefits all stakeholders in
                the festival ticketing industry.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: '800px',
              mx: 'auto',
              fontSize: '1.1rem',
              lineHeight: 1.8,
            }}
          >
            CrypTix represents a significant advancement in festival ticketing
            technology, offering a secure, transparent, and efficient solution to
            long-standing industry challenges. Through blockchain technology and
            smart contracts, we are positioned to transform the ticketing
            landscape and create value for all stakeholders.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutSection;
