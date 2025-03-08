import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  type: 'deposit' | 'transfer';
  onSubmit: (amount: string, to?: string) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  onClose,
  type,
  onSubmit,
}) => {
  const { account } = useWeb3React();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Validate recipient address for transfers
      if (type === 'transfer') {
        if (!recipient) {
          throw new Error('Please enter a recipient address');
        }
        if (!ethers.utils.isAddress(recipient)) {
          throw new Error('Invalid recipient address');
        }
        if (recipient.toLowerCase() === account?.toLowerCase()) {
          throw new Error('Cannot transfer to your own address');
        }
      }

      setLoading(true);
      await onSubmit(amount, recipient);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setRecipient('');
    setError(null);
    onClose();
  };

  const validateAmount = (value: string) => {
    if (value === '') return true;
    const regex = /^\d*\.?\d*$/;
    return regex.test(value);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {type === 'deposit' ? 'Deposit ETH' : 'Transfer ETH'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Amount"
              value={amount}
              onChange={(e) => {
                if (validateAmount(e.target.value)) {
                  setAmount(e.target.value);
                }
              }}
              fullWidth
              required
              disabled={loading}
              type="text"
              InputProps={{
                endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            {type === 'transfer' && (
              <TextField
                label="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
            )}

            <Typography variant="body2" color="text.secondary">
              {type === 'deposit' ? (
                'Deposit ETH from your connected wallet to the platform.'
              ) : (
                'Transfer ETH to another address. Make sure to verify the recipient address.'
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Processing...' : type === 'deposit' ? 'Deposit' : 'Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransactionModal;
