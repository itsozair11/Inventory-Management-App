"use client";

import Head from 'next/head';
import 'app/themes.css';
import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Fab,
  useTheme,
} from '@mui/material';
import { Add, Delete, Remove, Google, Logout } from '@mui/icons-material';
import { firestore } from 'app/config/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  signInWithGoogle,
  continueAsGuest,
  loginWithEmailAndPassword,
  logout,
  registerWithEmailAndPassword,
  sendPasswordResetEmail,
} from './config/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const modalStyle = {
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

export default function Home() {
  const theme = useTheme();
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(true);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemSellingPrice, setItemSellingPrice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true); // Added state to toggle between login and signup

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setItemName('');
    setItemQuantity('');
    setItemPrice('');
    setItemSellingPrice('');
    setOpen(false);
  };

  useEffect(() => {
    const clearLocalStorage = () => {
      localStorage.removeItem('guestInventory');
    };

    window.addEventListener('beforeunload', clearLocalStorage);

    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoggedIn(!!user);
      if (user) {
        setAuthModalOpen(false);
        const userInventoryRef = collection(firestore, `users/${user.uid}/inventory`);
        const unsubscribe = onSnapshot(userInventoryRef, (snapshot) => {
          const inventoryList = snapshot.docs.map((doc) => ({ name: doc.id, ...doc.data() }));
          setInventory(inventoryList);
        });

        return () => unsubscribe();
      } else {
        const storedInventory = JSON.parse(localStorage.getItem('guestInventory')) || [];
        setInventory(storedInventory);
      }
    });

    return () => {
      unsubscribeAuth();
      window.removeEventListener('beforeunload', clearLocalStorage);
    };
  }, []);

  const addItem = async (item, quantity, price, sellingPrice) => {
    if (!currentUser) {
      const newInventory = [...inventory, { name: item, quantity: parseInt(quantity), price: parseFloat(price), sellingPrice: parseFloat(sellingPrice) }];
      setInventory(newInventory);
      localStorage.setItem('guestInventory', JSON.stringify(newInventory));
      return;
    }

    const docRef = doc(collection(firestore, `users/${currentUser.uid}/inventory`), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const existingQuantity = docSnap.data().quantity || 0;
      const existingPrice = docSnap.data().price || 0;
      const existingSellingPrice = docSnap.data().sellingPrice || 0;
      await setDoc(docRef, { 
        quantity: existingQuantity + parseInt(quantity), 
        price: existingPrice,
        sellingPrice: existingSellingPrice
      });
    } else {
      await setDoc(docRef, { 
        quantity: parseInt(quantity), 
        price: parseFloat(price),
        sellingPrice: parseFloat(sellingPrice) 
      });
    }
  };

  const removeItem = async (item) => {
    if (!currentUser) {
      const newInventory = inventory.map(invItem => 
        invItem.name === item ? { ...invItem, quantity: invItem.quantity - 1 } : invItem
      ).filter(invItem => invItem.quantity > 0);
      setInventory(newInventory);
      localStorage.setItem('guestInventory', JSON.stringify(newInventory));
      return;
    }

    const docRef = doc(collection(firestore, `users/${currentUser.uid}/inventory`), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 });
      } else {
        await deleteDoc(docRef);
      }
    }
  };

  const deleteItem = async (item) => {
    if (!currentUser) {
      const newInventory = inventory.filter(invItem => invItem.name !== item);
      setInventory(newInventory);
      localStorage.setItem('guestInventory', JSON.stringify(newInventory));
      return;
    }

    const docRef = doc(collection(firestore, `users/${currentUser.uid}/inventory`), item);
    await deleteDoc(docRef);
  };

  const handleGuestLogin = () => {
    continueAsGuest();
    setAuthModalOpen(false);
    setInventory([]);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    setAuthModalOpen(false);
  };

  const handleEmailLogin = async () => {
    try {
      await loginWithEmailAndPassword(email, password);
      setAuthModalOpen(false);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const handleSignUp = async () => {
    try {
      await registerWithEmailAndPassword(email, password);
      setAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    setInventory([]);
  };

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(email);
      setForgotPasswordModalOpen(false);
      alert('Password reset email sent!');
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  };

  const totalCost = inventory.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2);
  const totalSellingPrice = inventory.reduce((total, item) => total + (item.quantity * item.sellingPrice), 0).toFixed(2);
  const potentialGrossProfit = (totalSellingPrice - totalCost).toFixed(2);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${theme.palette.grey[800]} 25%, ${theme.palette.grey[700]} 25%, ${theme.palette.grey[700]} 50%, ${theme.palette.grey[800]} 50%, ${theme.palette.grey[800]} 75%, ${theme.palette.grey[700]} 75%, ${theme.palette.grey[700]})`,
        backgroundSize: '200% 200%',
        animation: 'gradient 15s ease infinite',
        overflowY: 'auto',
        position: 'relative',
        paddingBottom: '16px',
      }}
    >
      <Head>
        <title>Your Inventory Management App</title>
      </Head>

      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        {isLoggedIn ? (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              backgroundColor: theme.palette.grey[700],
              color: 'blue',
              borderColor: theme.palette.grey[900],
              borderWidth: 2,
              '&:hover': {
                backgroundColor: theme.palette.grey[500],
                borderColor: theme.palette.grey[700],
              },
            }}
          >
            Logout
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setIsLoginMode(true); // Set to login mode
                setAuthModalOpen(true);
              }}
              sx={{
                backgroundColor: theme.palette.grey[700],
                color: 'blue',
                borderColor: theme.palette.grey[900],
                borderWidth: 2,
                '&:hover': {
                  backgroundColor: theme.palette.grey[500],
                  borderColor: theme.palette.grey[700],
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setIsLoginMode(false); // Set to signup mode
                setAuthModalOpen(true);
              }}
              sx={{
                marginLeft: 2,
                backgroundColor: theme.palette.grey[700],
                color: 'blue',
                borderColor: theme.palette.grey[900],
                borderWidth: 2,
                '&:hover': {
                  backgroundColor: theme.palette.grey[500],
                  borderColor: theme.palette.grey[700],
                },
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Box>

      <Typography variant="h3" color="white" gutterBottom>
        Inventory
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 600, width: '100%' }}>
        {inventory.map((item) => (
          <Card key={item.name} sx={{ bgcolor: theme.palette.grey[800] }}>
            <CardContent>
              <Typography variant="h5" color="white">{item.name}</Typography>
              <Typography variant="body2" color="white">Quantity: {item.quantity}</Typography>
              <Typography variant="body2" color="white">
                Cost per Unit: ${item.price ? item.price.toFixed(2) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="white">
                Selling Price per Unit: ${item.sellingPrice ? item.sellingPrice.toFixed(2) : 'N/A'}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton
                sx={{ color: theme.palette.info.main }}
                onClick={() => removeItem(item.name)}
              >
                <Remove />
              </IconButton>
              <IconButton
                sx={{ color: theme.palette.error.main }}
                onClick={() => deleteItem(item.name)}
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </Stack>

      <Typography variant="h6" color="white" sx={{ marginTop: 2 }}>
        Total Cost: ${totalCost}
      </Typography>
      <Typography variant="h6" color="white">
        Total Selling Price: ${totalSellingPrice}
      </Typography>
      <Typography variant="h6" color="white">
        Potential Gross Profit: ${potentialGrossProfit}
      </Typography>

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        <Add />
      </Fab>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-item-modal"
        aria-describedby="add-item-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Add New Item
          </Typography>
          <TextField
            label="Item Name"
            fullWidth
            variant="outlined"
            margin="normal"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            label="Quantity"
            fullWidth
            variant="outlined"
            margin="normal"
            type="number"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
          />
          <TextField
            label="Cost per Unit"
            fullWidth
            variant="outlined"
            margin="normal"
            type="number"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
          />
          <TextField
            label="Selling Price per Unit"
            fullWidth
            variant="outlined"
            margin="normal"
            type="number"
            value={itemSellingPrice}
            onChange={(e) => setItemSellingPrice(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              addItem(itemName, itemQuantity, itemPrice, itemSellingPrice);
              handleClose();
            }}
            sx={{ marginTop: 2 }}
          >
            Add Item
          </Button>
        </Box>
      </Modal>

      <Modal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        aria-labelledby="auth-modal"
        aria-describedby="auth-modal-description"
      >
        <Box sx={{
          ...modalStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: 4,
        }}>
          <Typography variant="h6" component="h2" sx={{ color: 'black' }}>
            {isLoginMode ? 'Login' : 'Sign Up'}
          </Typography>
          <TextField
  label="Email"
  fullWidth
  variant="outlined"
  margin="normal"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  disabled={!isLoginMode} // Disable email field only when not in login mode
/>
          <TextField
            label="Password"
            fullWidth
            variant="outlined"
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={isLoginMode ? handleEmailLogin : handleSignUp}
            sx={{ marginTop: 2 }}
          >
            {isLoginMode ? 'Login' : 'Sign Up'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGoogleLogin}
            sx={{ marginTop: 2 }}
          >
            Sign In with Google
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGuestLogin}
            sx={{ marginTop: 2 }}
          >
            Continue as Guest
          </Button>
          <Button
            variant="text"
            color="secondary"
            onClick={() => setForgotPasswordModalOpen(true)}
            sx={{ marginTop: 2 }}
          >
            Forgot My Password
          </Button>
        </Box>
      </Modal>

      <Modal
        open={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        aria-labelledby="forgot-password-modal"
        aria-describedby="forgot-password-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Forgot Password
          </Typography>
          <TextField
            label="Email"
            fullWidth
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleForgotPassword}
            sx={{ marginTop: 2 }}
          >
            Send Password Reset Email
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
