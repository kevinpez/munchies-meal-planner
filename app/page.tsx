"use client";

import { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Chip,
  Box,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CloudUpload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Home() {
  const [description, setDescription] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [meal, setMeal] = useState('');
  const [recipeImage, setRecipeImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pantryIngredients, setPantryIngredients] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const restrictions = [
    'Vegetarian',
    'Vegan',
    'Gluten-free',
    'Dairy-free',
    'Nut-free',
    'Keto',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-meal', {
        description: description.trim() || undefined,
        dietary_restrictions: dietaryRestrictions.join(', ') || undefined,
      });
      setMeal(response.data.meal);
      setRecipeImage(response.data.image_url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          alert('Backend endpoint not found. Please check if the server is running.');
        } else {
          alert(`Error: ${error.response?.data?.detail || 'An unknown error occurred'}`);
        }
      } else {
        alert('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleRestriction = (restriction: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/analyze-pantry', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPantryIngredients(response.data.ingredients);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Failed to analyze pantry image';
        alert(errorMessage);
        console.error('API Error:', {
          message: error.response?.data?.detail || error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        alert('Failed to upload image. Please try again.');
        console.error('Upload Error:', error instanceof Error ? error.message : 'Unknown error occurred');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Recipe Generator
        </Typography>

        {meal && (
          <Paper elevation={3} sx={{ mb: 4, p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Your Recipe:
            </Typography>
            {recipeImage && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <Image
                  src={recipeImage}
                  alt="Generated recipe"
                  width={300}
                  height={300}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            )}
            <Box
              className="meal-plan-content"
              dangerouslySetInnerHTML={{ __html: meal }}
            />
          </Paper>
        )}

        <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Describe your meal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., quick pasta dish, healthy salad, comfort food"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Dietary Restrictions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {restrictions.map(restriction => (
                  <Chip
                    key={restriction}
                    label={restriction}
                    onClick={() => toggleRestriction(restriction)}
                    color={dietaryRestrictions.includes(restriction) ? "primary" : "default"}
                    variant={dietaryRestrictions.includes(restriction) ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'Analyzing Pantry...' : 'Upload Pantry Image'}
                  <VisuallyHiddenInput type="file" onChange={handleImageUpload} accept="image/*" />
                </Button>

                {pantryIngredients && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Detected Ingredients:
                    </Typography>
                    <Typography variant="body2">
                      {pantryIngredients}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                size="large"
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} color="inherit" />
                    Generating your recipe...
                  </Box>
                ) : 'Generate Recipe'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
