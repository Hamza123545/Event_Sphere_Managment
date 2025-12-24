/**
 * ExhibitorSearch Component
 * Search and filter exhibitors by category, product, or keyword
 * Implements T107: User Story 3
 */

import { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

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
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        placeholder="Search by company name..."
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        onKeyPress={handleKeyPress}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ flexGrow: 1, minWidth: 200 }}
        disabled={isLoading}
      />
      <TextField
        placeholder="Search by product/service..."
        value={productKeyword}
        onChange={(e) => setProductKeyword(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{ flexGrow: 1, minWidth: 200 }}
        disabled={isLoading}
      />
      {categories.length > 0 && (
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)} disabled={isLoading}>
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <Button variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={isLoading}>
        Search
      </Button>
      <Button variant="outlined" startIcon={<Clear />} onClick={handleClear} disabled={isLoading}>
        Clear
      </Button>
    </Box>
  );
}

