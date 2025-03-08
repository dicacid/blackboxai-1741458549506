import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';

const ContactSection: React.FC = () => {
  const theme = useTheme();

  const socialLinks = [
    {
      name: 'Email',
      icon: EmailIcon,
      href: 'mailto:info@cryptix.io',
      color: theme.palette.grey[800],
    },
    {
      name: 'Twitter',
      icon: TwitterIcon,
      href: 'https://twitter.com/CryptixTickets',
      color: '#1DA1F2',
    },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      href: 'https://linkedin.com/company/cryptix',
      color: '#0A66C2',
    },
    {
      name: 'GitHub',
      icon: GitHubIcon,
      href: 'https://github.com/cryptix',
      color: theme.palette.grey[800],
    },
  ];

  return (
    <Box
      id="contact"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
              }}
            >
              Get in Touch
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 4,
              }}
            >
              Have questions about CrypTix? We'd love to hear from you.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Email us at:{' '}
                <Link
                  href="mailto:info@cryptix.io"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  info@cryptix.io
                </Link>
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              {socialLinks.map((social) => (
                <IconButton
                  key={social.name}
                  component="a"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  sx={{
                    color: social.color,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <social.icon sx={{ fontSize: 28 }} />
                </IconButton>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
              fontSize: '1.1rem',
              lineHeight: 1.8,
            }}
          >
            Join us in revolutionizing the festival ticketing industry. Whether
            you're an investor, festival organizer, or technology partner, CrypTix
            offers an opportunity to be part of the future of event ticketing.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactSection;
