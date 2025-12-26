# Project Dependencies

This document lists the Python packages installed during the development of the Weekend Analysis Tool.

## Explicitly Installed
- **openpyxl**: Used for reading Excel files (`pd.read_excel`).
- **yfinance**: Used for fetching real-time/historical stock data (Balance Sheets, etc.).

## Automatically Installed (Sub-dependencies)
- **et-xmlfile**: Dependency of openpyxl.
- **multitasking**: Dependency of yfinance.
- **peewee**: Dependency of yfinance.
- **frozendict**: Dependency of yfinance.
- **curl-cffi**: Dependency of yfinance.

## Pre-existing/Assumed
- **pandas**: Core data manipulation library.
- **numpy**: Numerical computing (dependency of pandas).
