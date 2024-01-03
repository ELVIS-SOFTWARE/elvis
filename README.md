
<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" height="200px" srcset="./public/logo.png">
    <img alt="logo" height="200px" src="./public/logo.png">
  </picture>
</div>

# Description

Elvis is a web application that allows you to manage your music school and their associated tasks.

## Member Management
* Management of educational members, teachers, and students
* Data extraction (CSV format)
* Advanced search capabilities

## Registration Module

* Selection of activity choices, schedule preferences, and teachers for members
* Dematerialized registration request form (online pre-registration)
* Family grouping: entering multiple payers and guardians for a student

## Scheduling Tool

* Complete scheduling for teachers and rooms
* Planning of recurring tasks (classes and holidays)
* Integration with administrative management (staff attendance/absence)

## Educational Module

* Student evaluation: evaluation methods, monitoring and updating of evaluation records
* Online teaching follow-up: document sharing, communication space (scheduled for release in 2024)

## Payment Management

* Payment schedules and tracking of receipts
* Configuration of payment methods
* Adding multiple payers for a student

# Installation

## Install with Docker
You can use docker to just run the project.

### docker-compose
You must define the environment variable `GITHUB_TOKEN` with a valid github token to be able to download the private gems if any.  
If you don't have one, you can remove the respective lines in the [docker-compose.yml](./docker-compose.yml) file: `:?GITHUB_TOKEN is required` in args of base elvis image.

Download the source code and run the commands below:

- `docker-compose build`
- `docker-compose up`

For the initial setup, create the first super user using the command below:
- `docker exec -it elvis bash`
- `rails console`
- ```ruby
  u = User.new email: "johndoe@gmail.com", is_admin: true, is_creator: true, first_name: "John", last_name: "Doe", current_sign_in_at: DateTime.now, last_sign_in_at: DateTime.now, sign_in_count: 1
  u.password = "test1234"
  u.password_confirmation = "test1234"
  u.save!
  ```
  
You can now access the application on http://localhost:7212

### docker run
You can also use docker directly to run the project.

In this case, you must run a postgresql server and set all environment variables like in the [docker-compose.yml](./docker-compose.yml) file.
The same applies to elastic-search.

1. `docker build --build-arg github_token -t elvis .`

2. For database setup, you have two options:
   - use docker run with init entrypoint
     - `docker run -p 7212:7212 -e ... --entrypoint "./entrypoints/init.sh" elvis`
   - run the commands below (in elvis container or directly in your terminal - requires local install of rails):
     - ```bash
       bundle exec rake elvis:plugins:discover
       bundle exec rake elvis:plugins:migrate
       ```
- `docker run -p 7212:7212 -e ... elvis`

### use online provided image
You can also use the image provided on this github repository, but this image does not contain any plugins.

To use this image, replace elvis:build image tag by `ghcr.io/elvis-software/elvis:latest` in the [docker-compose.yml](./docker-compose.yml) file and remove build section or in the docker run command.

## Install with script
You can use the script [ubuntu22.sh](dev-install/ubuntu22.sh) to install all dependencies and compile the project (you must run script at the root of the project).
- `chmod u+x ./dev-install/ubuntu22.sh`
- `./dev-install/ubuntu22.sh [psql_password] [rails admin email] [rails admin first name] [rails admin last name] [rails admin password]`

All parameters in [] are optional, if you don't specify them, default values will be used.

## Install manually

- install rvm
  - Install dependencies and rvm 
    ```shell
    sudo apt-get install software-properties-common
    sudo apt-add-repository -y ppa:rael-gc/rvm
    sudo apt-get update
    sudo apt-get install rvm libssl1.0-dev
    ```
  - optionnaly add your user to the rvm group to avoid using sudo
    ```shell
    sudo usermod -a -G rvm $USER
    ```
- install ruby version 3.0.2 
  - ```shell
    rvm install 3.0.2
    ```
- install bundler (bundle version is specified in the `Gemfile.lock` file) :
  ```shell
  gem install bundler
  ```
- install postgresql version 14 or postgresql-client version 14
  - ```shell
    sudo apt-get install postgresql-14
    ```
  - ```shell
    sudo apt-get install libpq-dev postgresql-client-14
    ```
- install node version 14
  - direct install
    ```shell
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
  - install with nvm
    ```shell
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" && \. "$NVM_DIR/nvm.sh"
    source $NVM_DIR/nvm.sh
    nvm install 14
    ```
- install yarn in global
  ```shell
  npm install --global yarn
  ```
- you can now install [optional dependencies](#optionnal-dependencies)
- go to [compile section](#compile)

#### link for more information of dev env
 - [rvm](https://github.com/rvm/ubuntu_rvm)
 - [nvm](https://github.com/nvm-sh/nvm/tree/v0.39.3)
 - [postgresql v14 specific](https://techviewleo.com/how-to-install-postgresql-database-on-ubuntu/)

#### Set up optional dependencies
- Local redis server
  -  `docker pull redis:6.2.6`
  -  `docker run -p 127.0.0.1:6379:6379 redis`
- Local elastic-search server
  - `docker pull elasticsearch:7.16.3`
  - `docker run -p 127.0.0.1:9200:9200 -p 127.0.0.1:9300:9300 -e "discovery.type=single-node" elasticsearch:7.16.3`

### Compile
at the root of the repository :
- `bundle install`
- `yarn`

### Database setup
- first run
  - `rails db:prepare`
- if you use an existing database
  - `rails db:migrate`
- if plugins are added, complete [plugin doc](./docs/Plugin-UtilisationAndConf.md) before run
- run a rails console to create an admin user: `rails console`
```ruby
u = User.new email: "johndoe@gmail.com", is_admin: true, first_name: "John", last_name: "Doe", current_sign_in_at: DateTime.now, last_sign_in_at: DateTime.now, sign_in_count: 1
u.password = "test1234"
u.password_confirmation = "test1234"
u.save!
```

### Run
- `foreman start`

# Additional information
## Recommended versions
- postgresql v14
- node v14
- ruby v3.0.2
- rails v6.1.4.1
- elastic-search v7.16.3
## Soft restart
- send `SIGUSR2` signal to process
- change restart.txt in tmp folder (add any value)
