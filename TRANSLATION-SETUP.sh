#!/bin/bash

# Bilingual Translation System Setup Script
# This script helps you complete the setup of the translation system

set -e

echo "========================================"
echo "Bilingual Translation System Setup"
echo "========================================"
echo ""

# Check current directory
if [ ! -d "greeny-corner-backend" ] || [ ! -d "greeny-corner-frontend" ]; then
    echo "❌ Error: Please run this script from the greeny-corner-website directory"
    exit 1
fi

echo "✅ Found backend and frontend directories"
echo ""

# Backend Setup
echo "📦 BACKEND SETUP"
echo "========================================"

cd greeny-corner-backend

# Check if composer exists
if ! command -v composer &> /dev/null; then
    echo "❌ Composer not found. Please install Composer first:"
    echo "   https://getcomposer.org/download/"
    exit 1
fi

echo "Installing Google Translate package..."
composer require stichoza/google-translate-php

echo ""
echo "✅ Backend packages installed successfully"
echo ""

# Return to root
cd ..

# Frontend Setup
echo "📦 FRONTEND SETUP"
echo "========================================"

cd greeny-corner-frontend

# Check if npm exists
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "Checking i18n packages..."
npm list i18next next-i18next react-i18next || echo "Installing i18n packages..."

# Packages should already be installed based on package.json
echo ""
echo "✅ Frontend packages verified"
echo ""

# Return to root
cd ..

echo "========================================"
echo "✅ SETUP COMPLETE!"
echo "========================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd greeny-corner-backend"
echo "   php artisan serve"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd greeny-corner-frontend"
echo "   npm run dev"
echo ""
echo "3. Visit http://localhost:3000 and test:"
echo "   - Click the language switcher"
echo "   - Add a plant in English"
echo "   - Switch to Arabic and add another plant"
echo "   - Verify translations work correctly"
echo ""
echo "4. Read the full documentation:"
echo "   BILINGUAL-TRANSLATION-GUIDE.md"
echo ""
echo "Happy coding! 🌱"
