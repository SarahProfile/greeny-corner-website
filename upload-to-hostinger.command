#!/bin/bash

# Greeny Corner - Upload to Hostinger Script
# Double-click this file to upload the Laravel backend files

clear
echo "🌿 Greeny Corner - Hostinger Upload Script"
echo "=========================================="
echo ""

# Configuration
SERVER="92.113.19.61"
USERNAME="u436103792"
PASSWORD="Letmelogin123#"
REMOTE_PATH="/domains/greenycorner.com/public_html"
LOCAL_BACKEND="/Users/sarah/greeny-corner-website/greeny-corner-backend"

echo "📁 Files to upload:"
echo "   - composer.json (with Google Translate package)"
echo "   - TranslationService.php"
echo "   - PlantController.php"
echo ""
echo "📍 Destination: ${SERVER}:${REMOTE_PATH}"
echo ""
read -p "Press ENTER to start upload, or Ctrl+C to cancel..."
echo ""

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: 'expect' command not found"
    echo "Installing expect..."
    if command -v brew &> /dev/null; then
        brew install expect
    else
        echo "Please install Homebrew first: https://brew.sh"
        exit 1
    fi
fi

# Create temporary expect script
cat > /tmp/upload_hostinger.exp << 'EXPECT_SCRIPT'
#!/usr/bin/expect -f

set timeout 120
set server [lindex $argv 0]
set username [lindex $argv 1]
set password [lindex $argv 2]
set remote_path [lindex $argv 3]
set local_backend [lindex $argv 4]

log_user 1

puts "Uploading composer.json..."
spawn scp -o StrictHostKeyChecking=no "${local_backend}/composer.json" "${username}@${server}:${remote_path}/composer.json"
expect {
    "*password:" {
        send "${password}\r"
        expect {
            "*100%" {
                puts "\n✅ composer.json uploaded"
            }
            timeout {
                puts "\n❌ composer.json upload timeout"
                exit 1
            }
        }
    }
    timeout {
        puts "\n❌ Connection timeout"
        exit 1
    }
}
expect eof

puts "\nUploading TranslationService.php..."
spawn scp -o StrictHostKeyChecking=no "${local_backend}/app/Services/TranslationService.php" "${username}@${server}:${remote_path}/app/Services/TranslationService.php"
expect {
    "*password:" {
        send "${password}\r"
        expect {
            "*100%" {
                puts "\n✅ TranslationService.php uploaded"
            }
            timeout {
                puts "\n❌ TranslationService.php upload timeout"
                exit 1
            }
        }
    }
    timeout {
        puts "\n❌ Connection timeout"
        exit 1
    }
}
expect eof

puts "\nUploading PlantController.php..."
spawn scp -o StrictHostKeyChecking=no "${local_backend}/app/Http/Controllers/API/PlantController.php" "${username}@${server}:${remote_path}/app/Http/Controllers/API/PlantController.php"
expect {
    "*password:" {
        send "${password}\r"
        expect {
            "*100%" {
                puts "\n✅ PlantController.php uploaded"
            }
            timeout {
                puts "\n❌ PlantController.php upload timeout"
                exit 1
            }
        }
    }
    timeout {
        puts "\n❌ Connection timeout"
        exit 1
    }
}
expect eof

puts "\n========================================"
puts "All files uploaded successfully!"
puts "========================================\n"

puts "⚠️  IMPORTANT NEXT STEP:"
puts "You need to run 'composer install' on the server to install Google Translate package"
puts ""
puts "Run this command now? (SSH must be enabled)"

EXPECT_SCRIPT

chmod +x /tmp/upload_hostinger.exp

# Run the upload
echo "Starting upload..."
/tmp/upload_hostinger.exp "$SERVER" "$USERNAME" "$PASSWORD" "$REMOTE_PATH" "$LOCAL_BACKEND"

UPLOAD_STATUS=$?

if [ $UPLOAD_STATUS -eq 0 ]; then
    echo ""
    echo "✅ Files uploaded successfully!"
    echo ""
    echo "=========================================="
    echo "⚠️  IMPORTANT NEXT STEP:"
    echo "=========================================="
    echo ""
    echo "You need to install the Google Translate package on the server."
    echo ""
    echo "Option 1: Use Hostinger Web Terminal"
    echo "  1. Go to hpanel.hostinger.com"
    echo "  2. Advanced → Terminal (or SSH Access)"
    echo "  3. Run these commands:"
    echo "     cd /domains/greenycorner.com/public_html"
    echo "     composer install"
    echo ""
    echo "Option 2: Try SSH from this terminal"
    read -p "Do you want to try connecting via SSH now? (y/n): " CONNECT_SSH

    if [ "$CONNECT_SSH" = "y" ] || [ "$CONNECT_SSH" = "Y" ]; then
        echo ""
        echo "Attempting SSH connection..."
        echo "Password: ${PASSWORD}"
        echo ""

        # Try to connect and run composer install
        expect << EOF
            set timeout 300
            spawn ssh -o StrictHostKeyChecking=no ${USERNAME}@${SERVER}
            expect {
                "*password:" {
                    send "${PASSWORD}\r"
                    expect {
                        "*\$ " {
                            send "cd /domains/greenycorner.com/public_html\r"
                            expect "*\$ "
                            send "composer install\r"
                            expect {
                                "*\$ " {
                                    send "exit\r"
                                }
                                timeout {
                                    puts "\nComposer install is running..."
                                    send "exit\r"
                                }
                            }
                        }
                        timeout {
                            puts "\n❌ SSH connection failed - port may be closed"
                            exit 1
                        }
                    }
                }
                timeout {
                    puts "\n❌ Connection timeout - SSH may not be enabled"
                    exit 1
                }
            }
            expect eof
EOF

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Google Translate package installed!"
            echo ""
            echo "🎉 Translation is now ready to use!"
            echo "Test it by switching language in your app."
        else
            echo ""
            echo "⚠️  SSH connection failed."
            echo "Please use Hostinger's web terminal to run:"
            echo "   cd /domains/greenycorner.com/public_html"
            echo "   composer install"
        fi
    else
        echo ""
        echo "Remember to run 'composer install' on the server!"
    fi
else
    echo ""
    echo "❌ Upload failed. Check the errors above."
fi

echo ""
echo "=========================================="
echo "Press ENTER to close this window..."
read

# Clean up
rm -f /tmp/upload_hostinger.exp
