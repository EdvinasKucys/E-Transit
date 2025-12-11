#!/bin/bash
# Script to create an admin account for E-Transit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}E-Transit Admin Account Creation${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Get input from user
read -p "Enter admin first name: " FIRST_NAME
read -p "Enter admin last name: " LAST_NAME
read -p "Enter admin username: " USERNAME
read -p "Enter admin email (optional): " EMAIL
read -sp "Enter admin password: " PASSWORD
echo ""
read -sp "Confirm password: " PASSWORD_CONFIRM
echo ""

# Validate inputs
if [ -z "$FIRST_NAME" ] || [ -z "$LAST_NAME" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    echo -e "${RED}Error: First name, last name, username, and password are required.${NC}"
    exit 1
fi

if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Error: Passwords do not match.${NC}"
    exit 1
fi

if [ ${#PASSWORD} -lt 6 ]; then
    echo -e "${RED}Error: Password must be at least 6 characters long.${NC}"
    exit 1
fi

if [ ${#USERNAME} -lt 3 ]; then
    echo -e "${RED}Error: Username must be at least 3 characters long.${NC}"
    exit 1
fi

# Navigate to backend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/../backend/Api"

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

echo -e "${YELLOW}Running admin creation script...${NC}"

# Create the dotnet command with parameters
if [ -z "$EMAIL" ]; then
    dotnet run --no-build -- create-admin "$FIRST_NAME" "$LAST_NAME" "$USERNAME" "$PASSWORD"
else
    dotnet run --no-build -- create-admin "$FIRST_NAME" "$LAST_NAME" "$USERNAME" "$PASSWORD" "$EMAIL"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Admin account created successfully!${NC}"
    echo -e "${GREEN}Username: $USERNAME${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}Failed to create admin account.${NC}"
    exit 1
fi
