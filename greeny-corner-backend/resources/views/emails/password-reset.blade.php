<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
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
        .token-box {
            background-color: #f0f9f0;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .token {
            font-size: 32px;
            font-weight: bold;
            color: #16a34a;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            background-color: #16a34a;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            border-top: 1px solid #e5e5e5;
            padding-top: 20px;
            font-size: 14px;
            color: #666;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #dc2626;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌿 Greeny Corner</div>
            <h1>Reset Your Password</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            
            <p>We received a request to reset your password for your Greeny Corner account. Use the reset token below to reset your password:</p>

            <div class="token-box">
                <div>Your Reset Token:</div>
                <div class="token">{{ $token }}</div>
            </div>

            <p>To reset your password:</p>
            <ol>
                <li>Go to the password reset page</li>
                <li>Enter your email/phone: <strong>{{ $user->email ?: $user->phone }}</strong></li>
                <li>Enter the token above: <strong>{{ $token }}</strong></li>
                <li>Enter your new password</li>
            </ol>

            <div style="text-align: center;">
                <a href="{{ $resetUrl }}" class="button">Reset Password</a>
            </div>

            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This token will expire in 15 minutes</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this token with anyone</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent from Greeny Corner - Your Plant Care Assistant</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>