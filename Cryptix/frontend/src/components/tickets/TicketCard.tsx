import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  SwapHoriz as TransferIcon,
  Sell as SellIcon,
  QrCode2 as QrCodeIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import type { Ticket } from '../../types';
import eventService from '../../services/eventService';
import web3Service from '../../services/web3Service';

interface TicketCardProps {
  ticket: Ticket;
  onTransfer?: (ticketId: string, toAddress: string) => Promise<void>;
  onList?: (ticketId: string, price: number) => Promise<void>;
  className?: string;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onTransfer,
  onList,
  className,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [toAddress, setToAddress] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTransferClick = () => {
    handleMenuClose();
    setTransferDialogOpen(true);
  };

  const handleListClick = () => {
    handleMenuClose();
    setListDialogOpen(true);
  };

  const handleQrCodeClick = async () => {
    try {
      const qrData = JSON.stringify({
        tokenId: ticket.metadata.tokenId,
        contractAddress: ticket.metadata.contractAddress,
        eventId: ticket.eventId,
      });
      const url = await QRCode.toDataURL(qrData);
      setQrCodeUrl(url);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleTransfer = async () => {
    if (!onTransfer) return;

    try {
      setProcessing(true);
      setError(null);
      await onTransfer(ticket.id, toAddress);
      setTransferDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer ticket');
    } finally {
      setProcessing(false);
    }
  };

  const handleList = async () => {
    if (!onList) return;

    try {
      setProcessing(true);
      setError(null);
      const price = parseFloat(listPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }
      if (ticket.maxResalePrice && price > ticket.maxResalePrice) {
        throw new Error(`Price cannot exceed ${eventService.formatPrice(ticket.maxResalePrice)}`);
      }
      await onList(ticket.id, price);
      setListDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list ticket');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: Ticket['status']): string => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'used':
        return theme.palette.grey[500];
      case 'expired':
        return theme.palette.error.main;
      case 'revoked':
        return theme.palette.error.dark;
      case 'forSale':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <>
      <Card 
        className={className}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <CardMedia
          component="img"
          height="140"
          image={ticket.metadata.image || '/placeholder.png'}
          alt={`Ticket ${ticket.id}`}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography gutterBottom variant="h6" component="div" noWrap>
              {ticket.eventName}
            </Typography>
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreIcon />
            </IconButton>
          </Box>

          <Chip
            label={ticket.status.toUpperCase()}
            size="small"
            sx={{
              bgcolor: getStatusColor(ticket.status),
              color: 'white',
              mb: 1,
            }}
          />

          <Box sx={{ mt: 2 }}>
            {ticket.section && (
              <Typography variant="body2" color="text.secondary">
                Section: {ticket.section}
              </Typography>
            )}
            {ticket.seat && (
              <Typography variant="body2" color="text.secondary">
                Seat: {ticket.seat}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Price: {eventService.formatPrice(ticket.currentPrice)}
            </Typography>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleQrCodeClick}
              startIcon={<QrCodeIcon />}
            >
              Show QR
            </Button>
            <Tooltip title="View on blockchain">
              <IconButton
                size="small"
                onClick={() => window.open(web3Service.getExplorerUrl(ticket.metadata.tokenId, 'address'), '_blank')}
              >
                <ExternalLinkIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {ticket.isResellable && ticket.status === 'active' && (
          <MenuItem onClick={handleListClick}>
            <ListItemIcon>
              <SellIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>List for Sale</ListItemText>
          </MenuItem>
        )}
        {ticket.status === 'active' && (
          <MenuItem onClick={handleTransferClick}>
            <ListItemIcon>
              <TransferIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Transfer</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)}>
        <DialogTitle>Transfer Ticket</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Recipient Address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="0x..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleTransfer}
            variant="contained"
            disabled={!toAddress || processing}
          >
            Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* List for Sale Dialog */}
      <Dialog open={listDialogOpen} onClose={() => setListDialogOpen(false)}>
        <DialogTitle>List Ticket for Sale</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Price"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            fullWidth
            margin="normal"
            type="number"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
          {ticket.maxResalePrice && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Maximum resale price: {eventService.formatPrice(ticket.maxResalePrice)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleList}
            variant="contained"
            disabled={!listPrice || processing}
          >
            List for Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>Ticket QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {qrCodeUrl && (
              <Box
                component="img"
                src={qrCodeUrl}
                alt="Ticket QR Code"
                sx={{ width: 256, height: 256 }}
              />
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Token ID: {ticket.metadata.tokenId}
            </Typography>
            <Button
              startIcon={<CopyIcon />}
              onClick={() => copyToClipboard(ticket.metadata.tokenId)}
              sx={{ mt: 1 }}
            >
              Copy Token ID
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketCard;
