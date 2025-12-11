# Admin Account Setup Guide

## Quick Start

To create an initial admin account, use one of the following methods:

### Windows (PowerShell)
```powershell
.\scripts\create-admin.ps1
```

### macOS/Linux (Bash)
```bash
./scripts/create-admin.sh
```

### Direct Command (Any Platform)
```bash
cd backend/Api
dotnet run -- create-admin "FirstName" "LastName" "username" "password" [email]
```

## What This Does

The admin account creation tool:
1. ✅ Creates a user in the `naudotojas` table with role "Administratorius"
2. ✅ Securely hashes the password using PBKDF2-SHA256
3. ✅ Prevents duplicate usernames
4. ✅ Validates input (minimum username length: 3, password length: 6)
5. ✅ Only allows creation of the first admin (subsequent attempts are rejected)

## Account Details After Creation

Once created, the admin can:
- Log in via the web interface using their username and password
- Create driver and inspector accounts from the admin dashboard
- Manage system settings (discounts, ticket prices)
- View statistics and reports
- Manage routes and schedules

## Password Reset

If you forget the admin password:
1. Delete the admin user from the database:
   ```sql
   DELETE FROM naudotojas WHERE role = 'Administratorius';
   ```
2. Run the creation script again to create a new admin account

## Security Notes

- Passwords are never stored in plain text
- The password hashing algorithm uses 10,000 iterations for security
- Each password has a unique salt
- The first admin account cannot be overwritten by accident

## Next Steps

After creating the admin account:
1. Start the backend API: `dotnet run` (in `backend/Api`)
2. Start the frontend: `npm run dev` (in `frontend/client`)
3. Navigate to `http://localhost:5173` (or your frontend URL)
4. Log in with your admin credentials
5. Create additional worker accounts as needed
