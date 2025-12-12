# E-Transit Admin Account Creation

This document explains how to create an initial admin account for the E-Transit system using the provided scripts.

## Prerequisites

- .NET 9 SDK installed
- PostgreSQL database configured and running
- Backend API configured with proper `appsettings.json`

## Creating an Admin Account

### Option 1: PowerShell (Windows)

1. Open PowerShell and navigate to the project root directory
2. Run the following command:

```powershell
.\scripts\create-admin.ps1
```

3. Follow the prompts to enter:
   - Admin first name
   - Admin last name
   - Admin username (min 3 characters)
   - Admin email (optional)
   - Admin password (min 6 characters)
   - Password confirmation

### Option 2: Bash Script (macOS/Linux)

1. Open Terminal and navigate to the project root directory
2. Make the script executable:

```bash
chmod +x scripts/create-admin.sh
```

3. Run the script:

```bash
./scripts/create-admin.sh
```

4. Follow the prompts to enter admin details

### Option 3: Direct dotnet Command

If you prefer to run the command directly without scripts:

#### Windows:
```powershell
cd backend/Api
dotnet run -- create-admin "John" "Doe" "jdoe" "SecurePassword123" "john@example.com"
```

#### macOS/Linux:
```bash
cd backend/Api
dotnet run -- create-admin "John" "Doe" "jdoe" "SecurePassword123" "john@example.com"
```

**Note:** Email is optional. Omit it if not needed:
```bash
dotnet run -- create-admin "John" "Doe" "jdoe" "SecurePassword123"
```

## Important Notes

⚠️ **Security Considerations:**

1. **First Admin Only**: The script will only create the first admin account. Subsequent attempts will be rejected if an admin already exists.
2. **Password Requirements**:
   - Minimum 6 characters
   - Passwords are hashed using PBKDF2-SHA256 with 10,000 iterations
3. **Username Requirements**:
   - Minimum 3 characters
   - Must be unique (no duplicates allowed)
4. **Credentials Storage**: After creation, securely store the admin credentials. The password cannot be retrieved from the database.

## Troubleshooting

### Error: "Backend directory not found"
- Ensure you're running the script from the project root directory
- Verify the `scripts` folder exists and is in the root

### Error: "Admin account already exists"
- An admin account has already been created
- If you need to create a new admin, delete the existing admin from the database and try again

### Error: "Username already exists"
- Choose a different username that hasn't been used before

### Error: Database connection failed
- Check that PostgreSQL is running
- Verify the connection string in `appsettings.json` is correct

## Logging In

Once the admin account is created:

1. Navigate to the E-Transit application login page
2. Select the appropriate role or use the username/password directly
3. Enter the username and password you created
4. You'll be redirected to the admin dashboard

From the admin dashboard, you can:
- Create additional driver and inspector accounts
- Manage discounts and ticket prices
- View statistics and reports
- Manage routes and schedules
