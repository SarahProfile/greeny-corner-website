<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $mode === 'login' ? 'Your Login Code' : 'Verify Your Account' }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #16a34a;
        }
        .content {
            margin-bottom: 30px;
        }
        .otp-box {
            background-color: #f0f9f0;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp {
            font-size: 48px;
            font-weight: bold;
            color: #16a34a;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .otp-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        .footer {
            border-top: 1px solid #e5e5e5;
            padding-top: 20px;
            font-size: 14px;
            color: #666;
        }
        .warning {
            background-color: #fef3cd;
            border: 1px solid #f6cc5d;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .success {
            background-color: #d1e7dd;
            border: 1px solid #a3cfbb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #0a3622;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌿 Greeny Corner</div>
            <h1>{{ $mode === 'login' ? 'Your Login Code' : 'Verify Your Account' }}</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $name }}</strong>,</p>
            
            @if($mode === 'login')
                <p>We received a request to sign in to your Greeny Corner account. Use the verification code below to complete your login:</p>
            @else
                <p>Welcome to Greeny Corner! Please use the verification code below to complete your account registration:</p>
            @endif

            <div class="otp-box">
                <div class="otp-label">Your Verification Code:</div>
                <div class="otp">{{ $otp }}</div>
            </div>

            <p><strong>How to use this code:</strong></p>
            <ol>
                <li>Go back to the Greeny Corner {{ $mode === 'login' ? 'login' : 'registration' }} page</li>
                <li>Enter the 6-digit code above when prompted</li>
                <li>{{ $mode === 'login' ? 'Access your plant dashboard' : 'Complete your account setup' }}</li>
            </ol>

            @if($mode === 'register')
                <div class="success">
                    <strong>🎉 Welcome to Greeny Corner!</strong>
                    <p>You're about to join our community of plant lovers. We're excited to help you take care of your green friends!</p>
                </div>
            @endif

            <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                    <li>This code will expire in <strong>10 minutes</strong></li>
                    <li>{{ $mode === 'login' ? 'If you didn\'t try to log in' : 'If you didn\'t create an account' }}, please ignore this email</li>
                    <li>Never share this code with anyone</li>
                    <li>Greeny Corner will never ask for your verification code over phone or email</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent from Greeny Corner - Your Plant Care Assistant</p>
            <p>Helping you grow a greener, healthier world, one plant at a time 🌱</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>