# Plant API Integration Setup Guide

Since Trefle.io has been discontinued, this project now uses **PlantNet** and **Perenual** APIs to provide comprehensive plant identification and care information.

## API Services Used

### 1. PlantNet API (Plant Identification)
- **Purpose**: Scientific plant identification from images
- **Accuracy**: 97% genus-level accuracy, 60% species-level accuracy
- **Cost**: Free with registration
- **Website**: https://my.plantnet.org/

### 2. Perenual API (Plant Care Data)
- **Purpose**: Comprehensive plant care information and botanical data
- **Database**: 10,000+ plant species with detailed care information
- **Cost**: Free tier available with API limits
- **Website**: https://perenual.com/docs/api

## Setup Instructions

### Step 1: Get PlantNet API Key

1. Visit https://my.plantnet.org/
2. Register for a free account
3. Create a new API key in your account settings
4. Copy the API key

### Step 2: Get Perenual API Key

1. Visit https://perenual.com/docs/api
2. Sign up for a free account
3. Navigate to your dashboard to get your API key
4. Copy the API key

### Step 3: Configure Environment Variables

Add these lines to your `.env` file:

```env
# PlantNet API Key for plant identification
# Get your free API key from https://my.plantnet.org/
PLANTNET_API_KEY=your_plantnet_api_key_here

# Perenual API Key for plant care data  
# Get your free API key from https://perenual.com/docs/api
PERENUAL_API_KEY=your_perenual_api_key_here
```

### Step 4: Run Database Migration

The new plant identification system requires additional database fields:

```bash
php artisan migrate
```

## How It Works

### Plant Identification Flow

1. **User uploads plant image** → PlantController processes the image
2. **PlantNet API** → Identifies plant species with scientific name
3. **Perenual API** → Enriches with care information, toxicity, growth data
4. **Fallback Systems** → If APIs fail, uses intelligent pattern recognition
5. **Database Storage** → Saves enhanced plant data with scientific name and Perenual ID

### Enhanced Data Available

With the new integration, each plant now includes:

- **Identification Data**:
  - Common and scientific names
  - Plant family and genus
  - Confidence score from AI identification
  
- **Care Information** (from Perenual):
  - Precise watering intervals
  - Light requirements
  - Temperature preferences
  - Humidity needs
  - Maintenance level

- **Safety Information**:
  - Toxicity to humans and pets
  - Safety recommendations

- **Growth Information**:
  - Mature size and spread
  - Growth rate and habits
  - Propagation methods

- **Additional Details**:
  - Origin and native habitat
  - Plant benefits (air purification, etc.)
  - Interesting botanical facts

## API Rate Limits

### PlantNet
- Free tier: 500 identifications per day
- No commercial restrictions for basic use

### Perenual  
- Free tier: 100 API calls per day
- Premium tiers available for higher usage

## Fallback System

If both APIs are unavailable or API keys aren't configured, the system automatically falls back to:

1. **Intelligent Pattern Recognition**: Uses image characteristics and plant database
2. **Local Plant Database**: 15+ common houseplants with full care information
3. **Default Care Information**: Safe, general care guidelines

## Testing

To test the integration:

1. Ensure API keys are configured in `.env`
2. Upload a plant image through the app
3. Check Laravel logs for API communication
4. Verify enhanced plant data is returned

## Troubleshooting

### Common Issues

1. **"PlantNet API key not configured"**
   - Ensure `PLANTNET_API_KEY` is set in `.env`
   - Restart your Laravel server after adding the key

2. **"Perenual API key not configured"**  
   - Ensure `PERENUAL_API_KEY` is set in `.env`
   - Check that your Perenual account is active

3. **API timeouts**
   - Both APIs have 15-30 second timeouts
   - System will fallback to local identification if APIs fail

4. **Database errors**
   - Run `php artisan migrate` to ensure new fields exist
   - Check that `scientific_name` and `perenual_id` columns were added

### Logs

Monitor plant identification in Laravel logs:
```bash
tail -f storage/logs/laravel.log | grep -i plant
```

## Migration from Trefle.io

If you were previously using Trefle.io:

1. Remove any `TREFLE_API_KEY` from your `.env`
2. Add the new PlantNet and Perenual API keys
3. Run the database migration to add new fields
4. Existing plants will continue to work with cached data
5. New plant uploads will use the enhanced API system

## API Documentation Links

- **PlantNet API Docs**: https://my.plantnet.org/doc/
- **Perenual API Docs**: https://perenual.com/docs/api
- **PlantNet Plant Database**: https://identify.plantnet.org/