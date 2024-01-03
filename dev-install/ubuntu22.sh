#!/bin/bash

set -e

echo ""
echo "-----------------------------------------------"
echo "Script tested on ubuntu 22 and 23. Possible errors if you have ruby o node installed without rvm and nvm"
echo "sudo privileges required to install dependencies"
echo ""
echo "-----------------------------------------------"
echo ""
sudo echo "sudo privileges granted"

# check if rvm is installed
if ! command -v rvm &>/dev/null; then
  echo ""
  echo "-----------------------------------------------"
  echo "updating apt-get"
  echo ""
  echo "-----------------------------------------------"
  echo ""
  sudo apt-add-repository -y ppa:rael-gc/rvm
  sudo apt-get update

  sleep 1

  echo ""
  echo "-----------------------------------------------"
  echo "installing base dependency (rvm, libssl, ...)"
  echo ""
  echo "-----------------------------------------------"
  echo ""
  sudo apt-get install -y software-properties-common rvm

  sleep 1

  echo ""
  echo "-----------------------------------------------"
  echo "add user to rvm group and source rvm"
  echo ""
  echo "-----------------------------------------------"
  echo ""
  sudo usermod -a -G rvm "$USER"
  source /etc/profile.d/rvm.sh

  echo ""
  echo "-----------------------------------------------"
  echo "reload user profile and terminal"
  echo ""
  echo "-----------------------------------------------"
  echo ""
  source ~/.profile
  source ~/.bashrc

  echo -e "\033[0;31m"
  echo "-----------------------------------------------"
  echo ""
  echo "rvm is installed, logout, relogin and run script again to continue\033[0m"
  echo ""
  echo "-----------------------------------------------"
  echo -e "\033[0m"
  sleep 2
  logout

  exit 1
fi

echo ""
echo "-----------------------------------------------"
echo "installing ruby 3.0.2"
echo ""
echo "-----------------------------------------------"
echo ""
rvm autolibs disable
rvm requirements
sudo apt install -y libssl1.0-dev openssl1.0
rvm install 3.0.2 --with-openssl-dir="$HOME"/.rvm/usr
source /etc/profile.d/rvm.sh

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
sudo apt-get install -y libpq-dev postgresql-14 postgresql-client-14

sleep 1

echo ""
echo "-----------------------------------------------"
echo "installing nodejs"
echo ""
echo "-----------------------------------------------"
echo ""
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR=${HOME}/.nvm
source "$NVM_DIR"/nvm.sh
nvm install 14

sleep 1

echo "-----------------------------------------------"
echo "create smlink for nodejs"
echo "-----------------------------------------------"
sudo ln -s "$(which node)" /usr/local/bin/node

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

# if current directory is not root directory, change to root directory
if [ ! -f "config/database.yml" ]; then
  cd ..
fi

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

# wait for user input
read -p "Press enter to exit"
