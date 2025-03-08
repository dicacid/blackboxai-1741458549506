import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Badge,
  IconButton,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Event as EventIcon,
  ConfirmationNumber as TicketIcon,
  TrendingUp as PriceIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
  Inventory as InventoryIcon,
  DoneAll as MarkReadIcon,
} from '@mui/icons-material';
import { useWeb3React } from '@web3-react/core';
import { useNavigate } from 'react-router-dom';
import { shortenAddress } from '../../utils/web3';
import notificationService, { Notification } from '../../services/notificationService';

interface TopBarProps {
  toggleDrawer: () => void;
  isDrawerOpen: boolean;
}

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  paddingRight: 24,
}));

const NotificationList = styled(List)(({ theme }) => ({
  width: '360px',
  maxHeight: '400px',
  overflow: 'auto',
  padding: theme.spacing(1),
}));

interface NotificationItemProps {
  priority: Notification['priority'];
}

const NotificationItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'priority',
})<NotificationItemProps>(({ theme, priority }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  borderLeft: `4px solid ${notificationService.getNotificationColor(priority)}`,
}));

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'event':
      return <EventIcon />;
    case 'ticket':
      return <TicketIcon />;
    case 'price':
      return <PriceIcon />;
    case 'security':
      return <SecurityIcon />;
    case 'system':
      return <InfoIcon />;
    default:
      return <NotificationsIcon />;
  }
};

const TopBar: React.FC<TopBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
  const { account, active, deactivate } = useWeb3React();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleDisconnect = () => {
    deactivate();
    handleMenuClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
    handleNotificationMenuClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <StyledToolbar>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="open drawer"
        onClick={toggleDrawer}
        sx={{
          marginRight: '36px',
          ...(isDrawerOpen && { display: 'none' }),
        }}
      >
        <MenuIcon />
      </IconButton>
      <Typography
        component="h1"
        variant="h6"
        color="inherit"
        noWrap
        sx={{ flexGrow: 1 }}
      >
        Cryptix
      </Typography>

      {/* Notifications */}
      <IconButton color="inherit" onClick={handleNotificationMenuOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Account */}
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
        {active && (
          <Typography variant="body2" sx={{ mr: 2 }}>
            {shortenAddress(account || '')}
          </Typography>
        )}
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleProfileMenuOpen}
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            <AccountCircle />
          </Avatar>
        </IconButton>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate('/tickets'); }}>
          <ListItemIcon>
            <InventoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Tickets" />
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDisconnect}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Disconnect" />
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        <NotificationList>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                priority={notification.priority}
                sx={{
                  opacity: notification.read ? 0.7 : 1,
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </NotificationItem>
            ))
          )}
        </NotificationList>
        <Divider />
        <MenuItem onClick={() => { handleNotificationMenuClose(); navigate('/notifications'); }}>
          <Typography color="primary" sx={{ width: '100%', textAlign: 'center' }}>
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>
    </StyledToolbar>
  );
};

export default TopBar;
