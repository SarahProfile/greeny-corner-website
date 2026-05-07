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
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 25px;
            margin-bottom: 30px;
            border-bottom: 2px solid #228B22;
        }
        .logo-container {
            margin-bottom: 15px;
        }
        .logo-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            background: linear-gradient(135deg, #32CD32 0%, #228B22 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        .logo-text {
            font-size: 28px;
            font-weight: bold;
            color: #228B22;
            margin-top: 10px;
        }
        .header-title {
            font-size: 22px;
            color: #333;
            margin-top: 15px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 15px;
        }
        .token-box {
            background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%);
            border: 2px solid #228B22;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .token-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .token {
            font-size: 36px;
            font-weight: bold;
            color: #228B22;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
        }
        .email-highlight {
            color: #228B22;
            font-weight: bold;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #32CD32 0%, #228B22 100%);
            color: #FFFFFF !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(34, 139, 34, 0.3);
        }
        .instructions {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
        }
        .warning {
            background-color: #fff8e1;
            border: 1px solid #ffcc02;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .warning-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .warning ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .footer {
            border-top: 1px solid #e5e5e5;
            padding-top: 20px;
            text-align: center;
            font-size: 13px;
            color: #888;
        }
        .footer-logo {
            color: #228B22;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <table align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="background: linear-gradient(135deg, #32CD32 0%, #228B22 100%); border-radius: 20px; padding: 20px; text-align: center;">
                            <span style="font-size: 40px;">🌿</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="logo-text">Greeny Corner</div>
            <h1 class="header-title">Reset Your Password</h1>
        </div>

        <div class="content">
            <p class="greeting">Hello <strong>{{ $user->name }}</strong>,</p>

            <p>We received a request to reset your password for your Greeny Corner account. Use the reset token below to reset your password:</p>

            <div class="token-box">
                <div class="token-label">Your Reset Token:</div>
                <div class="token">{{ $token }}</div>
            </div>

            <div class="instructions">
                <p><strong>To reset your password:</strong></p>
                <ol>
                    <li>Go to the password reset page</li>
                    <li>Enter your email: <span class="email-highlight">{{ $user->email ?: $user->phone }}</span></li>
                    <li>Enter the token above: <strong>{{ $token }}</strong></li>
                    <li>Enter your new password</li>
                </ol>
            </div>

            <div class="button-container">
                <a href="{{ $resetUrl }}" class="button" style="color: #FFFFFF;">Reset Password</a>
            </div>

            <div class="warning">
                <div class="warning-title">⚠️ Important:</div>
                <ul>
                    <li>This token will expire in <strong>15 minutes</strong></li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this token with anyone</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent from <span class="footer-logo">🌿 Greeny Corner</span></p>
            <p>Your Plant Care Assistant</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
