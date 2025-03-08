import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalLinkIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { shortenAddress } from '../utils/web3';
import TransactionModal from '../components/wallet/TransactionModal';
import web3Service from '../services/web3Service';

interface Transaction {
  hash: string;
  type: 'incoming' | 'outgoing';
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  to?: string;
  from?: string;
}

const Wallet: React.FC = () => {
  const { account, active, library } = useWeb3React();
  const [balance, setBalance] = useState<string>('0');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (active && account && library) {
      web3Service.setProvider(library);
      fetchBalanceAndTransactions();
    }
  }, [active, account, library]);

  const fetchBalanceAndTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ETH balance
      const newBalance = await web3Service.getBalance(account!);
      setBalance(newBalance);

      // Fetch recent transactions (this would typically come from your backend/indexer)
      const mockTransactions: Transaction[] = [
        {
          hash: '0x123...abc',
          type: 'incoming',
          amount: '0.1',
          timestamp: Date.now() - 3600000,
          status: 'confirmed',
          from: '0xdef...789',
        },
        {
          hash: '0x456...def',
          type: 'outgoing',
          amount: '0.05',
          timestamp: Date.now() - 7200000,
          status: 'confirmed',
          to: '0x789...abc',
        },
      ];
      setTransactions(mockTransactions);
    } catch (err) {
      setError('Failed to fetch wallet data');
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount: string) => {
    try {
      const hash = await web3Service.deposit(amount);
      
      // Add pending transaction
      const newTx: Transaction = {
        hash,
        type: 'incoming',
        amount,
        timestamp: Date.now(),
        status: 'pending',
        from: account!,
      };
      setTransactions(prev => [newTx, ...prev]);

      // Wait for confirmation
      await web3Service.waitForTransaction(hash);
      
      // Update transaction status and balance
      setTransactions(prev =>
        prev.map(tx =>
          tx.hash === hash ? { ...tx, status: 'confirmed' } : tx
        )
      );
      fetchBalanceAndTransactions();

      setSnackbar({
        open: true,
        message: 'Deposit successful',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Deposit failed',
        severity: 'error',
      });
    }
  };

  const handleTransfer = async (amount: string, to?: string) => {
    if (!to) return;

    try {
      const hash = await web3Service.transfer(to, amount);
      
      // Add pending transaction
      const newTx: Transaction = {
        hash,
        type: 'outgoing',
        amount,
        timestamp: Date.now(),
        status: 'pending',
        to,
      };
      setTransactions(prev => [newTx, ...prev]);

      // Wait for confirmation
      await web3Service.waitForTransaction(hash);
      
      // Update transaction status and balance
      setTransactions(prev =>
        prev.map(tx =>
          tx.hash === hash ? { ...tx, status: 'confirmed' } : tx
        )
      );
      fetchBalanceAndTransactions();

      setSnackbar({
        open: true,
        message: 'Transfer successful',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Transfer failed',
        severity: 'error',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Address copied to clipboard',
      severity: 'success',
    });
  };

  const openInExplorer = (hash: string, type: 'tx' | 'address' = 'tx') => {
    window.open(web3Service.getExplorerUrl(hash, type), '_blank');
  };

  if (!active) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="info">
            Please connect your wallet to view your balance and transactions.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Wallet
        </Typography>

        <Grid container spacing={3}>
          {/* Balance Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WalletIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Balance</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {parseFloat(balance).toFixed(4)} ETH
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDepositModalOpen(true)}
                >
                  Deposit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TransferIcon />}
                  onClick={() => setTransferModalOpen(true)}
                >
                  Transfer
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Address Card */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Wallet Address
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                bgcolor: 'background.default',
                p: 2,
                borderRadius: 1
              }}>
                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                  {account}
                </Typography>
                <Tooltip title="Copy address">
                  <IconButton onClick={() => copyToClipboard(account || '')}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View in explorer">
                  <IconButton onClick={() => openInExplorer(account!, 'address')}>
                    <ExternalLinkIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : transactions.length === 0 ? (
                <Alert severity="info">
                  No transactions found.
                </Alert>
              ) : (
                <List>
                  {transactions.map((tx) => (
                    <React.Fragment key={tx.hash}>
                      <ListItem
                        secondaryAction={
                          <IconButton onClick={() => openInExplorer(tx.hash)}>
                            <ExternalLinkIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <PaymentIcon color={tx.type === 'incoming' ? 'success' : 'primary'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>
                                {tx.type === 'incoming' ? 'Received' : 'Sent'} {tx.amount} ETH
                              </Typography>
                              <Chip
                                label={tx.status}
                                size="small"
                                color={
                                  tx.status === 'confirmed' ? 'success' :
                                  tx.status === 'pending' ? 'warning' : 'error'
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {tx.type === 'incoming' ? 'From: ' : 'To: '}
                                {shortenAddress(tx.type === 'incoming' ? tx.from! : tx.to!)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(tx.timestamp).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Transaction Modals */}
        <TransactionModal
          open={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          type="deposit"
          onSubmit={handleDeposit}
        />
        <TransactionModal
          open={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          type="transfer"
          onSubmit={handleTransfer}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Wallet;
