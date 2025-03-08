import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button,
  IconButton,
  useScrollTrigger,
  Slide,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  window?: () => Window;
}

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

const HideOnScroll = (props: Props) => {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <div>{children}</div>
    </Slide>
  );
};

const Footer = styled('footer')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(6),
  marginTop: 'auto',
}));

const LandingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { label: 'Features', id: 'features' },
    { label: 'About', id: 'about' },
    { label: 'Contact', id: 'contact' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const drawer = (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" component="div" sx={{ color: 'primary.main' }}>
          CrypTix
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.id} onClick={() => scrollToSection(item.id)}>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        <ListItem button component={RouterLink} to="/app">
          <ListItemText primary="Launch App" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HideOnScroll>
        <AppBar position="fixed" color="default" elevation={0}>
          <Container maxWidth="lg">
            <Toolbar disableGutters>
              <Typography
                variant="h6"
                noWrap
                component={RouterLink}
                to="/"
                sx={{
                  flexGrow: 1,
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                CrypTix
              </Typography>
              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    sx={{ mx: 1 }}
                  >
                    {item.label}
                  </Button>
                ))}
                <Button
                  component={RouterLink}
                  to="/app"
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2 }}
                >
                  Launch App
                </Button>
              </Box>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
      <Offset />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Footer>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CrypTix. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Revolutionizing Festival Ticketing with Blockchain Technology
          </Typography>
        </Container>
      </Footer>
    </Box>
  );
};

export default LandingLayout;
