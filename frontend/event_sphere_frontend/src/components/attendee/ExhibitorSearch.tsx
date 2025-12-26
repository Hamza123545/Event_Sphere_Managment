/**
 * ExhibitorSearch Component
 * Search and filter exhibitors by category, product, or keyword
 * Implements T107: User Story 3
 */

import { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import {
  GlassContainer,
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface ExhibitorSearchProps {
  onSearch: (params: { category?: string; productKeyword?: string; companyName?: string }) => void;
  categories?: string[];
  isLoading?: boolean;
}

export default function ExhibitorSearch({ onSearch, categories = [], isLoading = false }: ExhibitorSearchProps) {
  const [category, setCategory] = useState('');
  const [productKeyword, setProductKeyword] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleSearch = () => {
    onSearch({
      category: category || undefined,
      productKeyword: productKeyword.trim() || undefined,
      companyName: companyName.trim() || undefined,
    });
  };

  const handleClear = () => {
    setCategory('');
    setProductKeyword('');
    setCompanyName('');
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <GlassContainer sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by company name..."
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: activeTheme.textSecondary }} />,
          }}
          sx={{ 
            flexGrow: 1, 
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              bgcolor: activeTheme.surface,
              color: activeTheme.textPrimary,
              '& fieldset': {
                borderColor: activeTheme.border,
              },
              '&:hover fieldset': {
                borderColor: activeTheme.accent,
              },
            },
            '& .MuiInputLabel-root': {
              color: activeTheme.textSecondary,
            },
          }}
          disabled={isLoading}
        />
        <TextField
          placeholder="Search by product/service..."
          value={productKeyword}
          onChange={(e) => setProductKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ 
            flexGrow: 1, 
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              bgcolor: activeTheme.surface,
              color: activeTheme.textPrimary,
              '& fieldset': {
                borderColor: activeTheme.border,
              },
              '&:hover fieldset': {
                borderColor: activeTheme.accent,
              },
            },
          }}
          disabled={isLoading}
        />
        {categories.length > 0 && (
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: activeTheme.textSecondary }}>Category</InputLabel>
            <Select 
              value={category} 
              label="Category" 
              onChange={(e) => setCategory(e.target.value)} 
              disabled={isLoading}
              sx={{
                bgcolor: activeTheme.surface,
                color: activeTheme.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: activeTheme.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: activeTheme.accent,
                },
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <ActionButton primary startIcon={<Search />} onClick={handleSearch} disabled={isLoading}>
          Search
        </ActionButton>
        <ActionButton startIcon={<Clear />} onClick={handleClear} disabled={isLoading}>
          Clear
        </ActionButton>
      </Box>
    </GlassContainer>
  );
}

