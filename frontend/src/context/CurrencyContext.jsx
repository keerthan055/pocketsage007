import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const currencies = [
  { code: 'USD', symbol: '$', name: 'USA', flag: '🇺🇸', rate: 1 },
  { code: 'INR', symbol: '₹', name: 'India', flag: '🇮🇳', rate: 83.5 },
  { code: 'EUR', symbol: '€', name: 'Europe', flag: '🇪🇺', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'UK', flag: '🇬🇧', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japan', flag: '🇯🇵', rate: 156.4 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE', flag: '🇦🇪', rate: 3.67 },
  { code: 'CAD', symbol: 'C$', name: 'Canada', flag: '🇨🇦', rate: 1.36 },
  { code: 'AUD', symbol: 'A$', name: 'Australia', flag: '🇦🇺', rate: 1.51 },
];

export const CurrencyProvider = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState(currencies[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencyPreference();
  }, []);

  const fetchCurrencyPreference = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:8000/currency/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const saved = currencies.find(c => c.code === response.data.currency_code);
        if (saved) setCurrentCurrency(saved);
      }
    } catch (err) {
      console.error("Failed to fetch currency preference:", err);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = async (currency) => {
    setCurrentCurrency(currency);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put('http://localhost:8000/currency/update', {
          currency_code: currency.code,
          country_name: currency.name,
          symbol: currency.symbol
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Failed to save currency preference:", err);
    }
  };

  const formatCurrency = (amount, precision = 2) => {
    // Convert from base USD (all storage is in USD for consistency) to target currency
    const converted = amount * currentCurrency.rate;
    return `${currentCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}`;
  };

  const convertAmount = (amount) => {
    return amount * currentCurrency.rate;
  };

  return (
    <CurrencyContext.Provider value={{ currentCurrency, changeCurrency, formatCurrency, convertAmount, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};
