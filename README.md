# 🌱 Greeny Corner

A comprehensive plant care management platform that combines modern web technologies with AI-powered plant identification and care recommendations.

## 📖 Project Description

Greeny Corner is a full-stack web application designed to help plant enthusiasts manage their plant collections with ease. The platform offers personalized care schedules, AI-powered plant identification, disease detection, and a comprehensive plant management system with Firebase authentication and real-time notifications.

### 🎯 Key Features

- **🔐 User Authentication**: Secure login with Firebase (Google, phone, email)
- **🌿 Plant Management**: Add, edit, and organize your plant collection
- **📅 Care Scheduling**: Automated watering, fertilizing, and tilling reminders
- **🔔 Smart Notifications**: Push notifications for care activities
- **🤖 AI Plant Identification**: Identify plants using machine learning
- **🏥 Disease Detection**: AI-powered plant health monitoring
- **🌍 Multilingual Support**: Available in multiple languages (i18next)
- **📱 Responsive Design**: Works seamlessly on all devices
- **☁️ Cloud Storage**: Secure image storage with Firebase

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Internationalization**: next-i18next
- **HTTP Client**: Axios
- **Notifications**: Web Push API

### Backend
- **Framework**: Laravel 11 (PHP)
- **Database**: MySQL/SQLite
- **Authentication**: Laravel Sanctum + Firebase Admin SDK
- **API**: RESTful API
- **File Storage**: Laravel Storage + Firebase integration
- **Queue System**: Laravel Queues
- **Email**: Laravel Mail

### AI/ML Components
- **Plant Identification**: Custom CNN models
- **Disease Classification**: TensorFlow/PyTorch models
- **Image Processing**: Python-based processing pipeline

## 📁 Project Structure

```
GreenyWebsite/
├── greeny-corner-frontend/     # Next.js frontend application
│   ├── src/
│   │   ├── app/               # Next.js app router pages
│   │   ├── components/        # Reusable React components
│   │   ├── lib/              # Utility functions and API clients
│   │   ├── hooks/            # Custom React hooks
│   │   └── styles/           # Global styles and Tailwind config
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── next.config.js        # Next.js configuration
├── greeny-corner-backend/      # Laravel backend API
│   ├── app/
│   │   ├── Http/Controllers/  # API controllers
│   │   ├── Models/           # Eloquent models
│   │   ├── Services/         # Business logic services
│   │   └── Mail/             # Email templates
│   ├── database/
│   │   ├── migrations/       # Database schema migrations
│   │   └── seeders/          # Database seeders
│   ├── routes/               # API routes
│   ├── storage/              # File storage
│   └── composer.json         # Backend dependencies
├── houseplant-ai-model/        # AI plant identification (local)
└── plant-disease-classifier/   # Disease detection AI (local)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PHP 8.2+ and Composer
- MySQL/PostgreSQL database
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SarahProfile/greeny-corner-website.git
   cd greeny-corner-website
   ```

2. **Setup Frontend**
   ```bash
   cd greeny-corner-frontend
   npm install
   cp .env.example .env.local
   # Configure your environment variables
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd greeny-corner-backend
   composer install
   cp .env.example .env
   # Configure your database and Firebase credentials
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```

### Environment Configuration

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

#### Backend (.env)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=greeny_corner
DB_USERNAME=your_username
DB_PASSWORD=your_password

FIREBASE_CREDENTIALS=path/to/firebase-credentials.json
```

## 🎮 Usage

1. **Start the development servers**:
   - Frontend: `npm run dev` (http://localhost:3000)
   - Backend: `php artisan serve` (http://127.0.0.1:8000)

2. **Access the application**:
   - Open http://localhost:3000 in your browser
   - Sign up or login with Google/email/phone
   - Start adding plants to your collection
   - Set up care schedules and receive notifications

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/firebase` - Firebase token validation
- `POST /api/auth/logout` - User logout

### Plants Management
- `GET /api/plants` - Get user's plants
- `POST /api/plants` - Create new plant
- `GET /api/plants/{id}` - Get plant details
- `PUT /api/plants/{id}` - Update plant
- `DELETE /api/plants/{id}` - Delete plant
- `PUT /api/plants/{id}/schedule` - Update care schedule

### Care Actions
- `POST /api/plants/{id}/water` - Record watering
- `POST /api/plants/{id}/fertilize` - Record fertilizing
- `POST /api/plants/{id}/till` - Record tilling

## 🎨 Key Components

### Frontend Components
- `PlantCard`: Display plant information
- `PlantForm`: Add/edit plant forms
- `CareSchedule`: Manage care schedules
- `NotificationService`: Handle push notifications
- `PhoneAuth`: Phone number authentication
- `PlantIdentifier`: AI plant identification interface

### Backend Models
- `User`: User management with Firebase integration
- `Plant`: Plant data and relationships
- `CareSchedule`: Care scheduling and notifications

## 🔒 Security Features

- Firebase Authentication integration
- CORS protection
- Input validation and sanitization
- File upload security
- Rate limiting on API endpoints
- Secure environment variable handling

## 🌐 Deployment

### Production Deployment

1. **Build the frontend**:
   ```bash
   cd greeny-corner-frontend
   npm run build
   ```

2. **Deploy to your hosting provider** (Hostinger, Vercel, etc.)

3. **Configure production environment variables**

4. **Set up database and run migrations**:
   ```bash
   php artisan migrate --force
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase for authentication and storage services
- Next.js team for the amazing React framework
- Laravel team for the robust PHP framework
- Plant identification APIs and datasets
- Open source community for various packages and tools

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: [Your contact information]

---

**🌱 Happy Plant Caring!** 🌿