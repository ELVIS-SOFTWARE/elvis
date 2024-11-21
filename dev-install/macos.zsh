#!/bin/bash

set -e

echo ""
echo "-----------------------------------------------"
echo "Warning: this script is not completely tested because we don't have other macos machine. If you find any error, please open an issue on github"
echo "sudo privileges required to install dependencies"
echo ""
echo "-----------------------------------------------"
echo ""
sudo echo "sudo privileges granted"

if ! command -v brew &>/dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# check if rvm is installed
if ! command -v rvm &>/dev/null; then
  echo ""
  echo "-----------------------------------------------"
  echo "updating apt-get"
  echo ""
  echo "-----------------------------------------------"
  echo ""

  brew install gnupg
  gpg --keyserver hkp://pool.sks-keyservers.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB
  \curl -sSL https://get.rvm.io | bash

  sleep 1

  echo ""
  echo "-----------------------------------------------"
  echo "rvm is installed, launch a new terminal and run script again to continue"
  echo ""
  echo "-----------------------------------------------"
  echo ""

  exit 1
fi

echo ""
echo "-----------------------------------------------"
echo "installing ruby 3.3.2"
echo ""
echo "-----------------------------------------------"
echo ""
brew install openssl1.1
PKG_CONFIG_PATH=$(brew --prefix openssl@1.1)/lib/pkgconfig rvm install 3.3.6 --with-openssl-dir=$(brew --prefix openssl@1.1)
source "$HOME"/.rvm/scripts/rvm

sleep 1

echo ""
echo "-----------------------------------------------"
echo "installing bundler"
echo ""
echo "-----------------------------------------------"
echo ""
gem install bundler

echo ""
echo "-----------------------------------------------"
echo "installing postgresql version 14"
echo ""
echo "-----------------------------------------------"
echo ""
brew install postgresql@14
ln -sfv /opt/homebrew/opt/postgresql@14/*.plist ~/Library/LaunchAgents
alias pg_start="launchctl load ~/Library/LaunchAgents"
alias pg_stop="launchctl unload ~/Library/LaunchAgents"
pg_start
createdb `whoami`
createuser -s postgres
brew install libpq

sleep 1

echo ""
echo "-----------------------------------------------"
echo "installing nodejs"
echo ""
echo "-----------------------------------------------"
echo ""
brew install nvm
mkdir "$HOME"/.nvm
export NVM_DIR=~/.nvm
source $(brew --prefix nvm)/nvm.sh
source ~/.bash_profile
nvm install 20

sleep 1

echo ""
echo "-----------------------------------------------"
echo "installing yarn"
echo ""
echo "-----------------------------------------------"
echo ""
npm install --global yarn

echo ""
echo "-----------------------------------------------"
echo "installing yarn dependencies"
echo ""
echo "-----------------------------------------------"
echo ""
yarn install

echo ""
echo "-----------------------------------------------"
echo "change git config to store crédentials"
echo ""
echo "-----------------------------------------------"
echo ""
git config --global credential.helper store

echo ""
echo "------------------------------------------------------------"
echo "credentials now stored, use github token when password is asked"
echo ""
echo "------------------------------------------------------------"
echo ""

sleep 1

echo ""
echo "-----------------------------------------------"
echo "installing ruby dependencies"
echo ""
echo "-----------------------------------------------"
echo ""
bundle install

sleep 1

# create variable password with params value or default value
PASSWORD=${1:-"dev-1234"}

echo ""
echo "-----------------------------------------------"
echo "configuring postgres"
echo ""
echo "-----------------------------------------------"
echo ""

sudo -u postgres psql -c "CREATE ROLE $USER WITH LOGIN SUPERUSER PASSWORD '$PASSWORD';" || true

echo ""
echo "-----------------------------------------------"
echo "editing database.yml in config folder"
echo ""
echo "-----------------------------------------------"
echo ""

# replace password ans username in database.yml
sed -i "s/username: .*/username: $USER/g" config/database.yml
sed -i "s/password: .*/password: $PASSWORD/g" config/database.yml

sleep 1

echo ""
echo "-----------------------------------------------"
echo "creating database"
echo ""
echo "-----------------------------------------------"
echo ""
rails db:prepare

echo ""
echo "-----------------------------------------------"
echo "installing foreman"
echo ""
echo "-----------------------------------------------"
echo ""
gem install foreman

echo ""
echo "-----------------------------------------------"
echo "installing dependencies finished, now configuring"
echo ""
echo "-----------------------------------------------"
echo ""

sleep 1

echo ""
echo "-----------------------------------------------"
echo "create default admin user"
echo ""
echo "-----------------------------------------------"
echo ""

# get email from environment variable or default value
EMAIL=${2:-"johndoe@gmail.com"}
FIRST_NAME=${3:-"John"}
LAST_NAME=${4:-"Doe"}
USER_PASSWORD=${5:-"test1234"}

rails console <<EOF
if User.find_by(email: '$EMAIL', first_name: "$FIRST_NAME", last_name: "$LAST_NAME").nil?
  u = User.new email: "$EMAIL", is_admin: true, first_name: "$FIRST_NAME", last_name: "$LAST_NAME", current_sign_in_at: DateTime.now, last_sign_in_at: DateTime.now, sign_in_count: 1
  u.password = "$USER_PASSWORD"
  u.password_confirmation = "$USER_PASSWORD"
  u.save!
end
EOF

echo "admin user created with email: $EMAIL, password: $USER_PASSWORD"

sleep 1

echo ""
echo "------------------------------------------------------------------"
echo "configuring finished, you can now run application with foreman start"
echo ""
echo "------------------------------------------------------------------"
echo ""
