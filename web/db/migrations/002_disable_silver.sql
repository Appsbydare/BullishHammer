-- XAG/USD is not on the free Twelve Data plan (needs Grow or higher).
UPDATE symbols SET active = false WHERE symbol = 'XAGUSD';
