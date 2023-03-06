'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const api = require('@beauraines/rtm-api');
const merge = require('deepmerge');
const login = require('./login.js');


/**
 * Default Configuration
 */
const BASE_CONFIG = path.normalize(__dirname + '/../../config.json');

/**
 * Default User Configuration
 */
let DEFAULT_USER_CONFIG = path.normalize(os.homedir() + '/.rtm.json');
let DEFAULT_EXTRA_CONFIG = path.normalize(os.homedir() + '/.rtm.config.json');


/**
 * RTM CLI Configuration
 */
class Config {


  /**
   * Set up a new Configuration
   */
  constructor() {
    this.reset(DEFAULT_USER_CONFIG);
    this.read(DEFAULT_EXTRA_CONFIG);
  }

  /**
   * Reset the RTM Configuration with the specified User config file
   * @param {string} file User Config File
   */
  reset(file) {
    this._CONFIG = {};
    this.read(BASE_CONFIG);
    this.read(file);
    this.USER_CONFIG = file;
  }


  /**
   * Get the Configuration Object
   * @returns {object}
   */
  get() {
    return this.config;
  }

  /**
   * Get the Configuration Object
   * @returns {object}
   */
  get config() {
    if ( this._CONFIG === {} ) {
      throw "No Configuration Set";
    }
    this._parseOptions();
    return this._CONFIG;
  }

  /**
   * Get the RTMClient from the configuration
   * @returns {RTMClient}
   */
  get client() {
    if ( !this._CONFIG._client ) {
      throw "No Client configuration set";
    }
    return this._CONFIG._client;
  }

  /**
   * Get the RTMUser from the configuration
   *
   * If no RTMUser is saved, start the login process
   * @param {function} callback callback function
   * @param {RTMUser} callback.user The RTM User
   */
  user(callback) {
    if ( !this._CONFIG._user ) {
      return login(callback);
    }
    return callback(this._CONFIG._user);
  }


  /**
   * Read a configuration file to merge with the existing configuration
   * @param {string} file Configuration file path
   */
  read(file) {
    if ( file && fs.existsSync(file) ) {

      // Read the config file
      let config = JSON.parse(fs.readFileSync(file, 'utf-8'));

      // Merge config into CONFIG
      this._CONFIG = merge(this._CONFIG, config, {
        arrayMerge: function (d, s) {
          return d.concat(s);
        }
      });

      // Parse the Config Object
      this._parseConfig();

    }
  }


  /**
   * Save the RTM User to the user configuration file
   * @param {RTMUser} user RTM User to save
   */
  saveUser(user) {
    this._CONFIG._user = user;
    let config = {};
    if ( fs.existsSync(this.USER_CONFIG) ) {
      config = JSON.parse(fs.readFileSync(this.USER_CONFIG, 'utf-8'));
    }
    config.user = this.client.user.export(user);
    fs.writeFileSync(this.USER_CONFIG, JSON.stringify(config, null, 2));
  }


  /**
   * Remove any saved RTM User information from the User config file
   */
  removeUser() {
    if ( fs.existsSync(this.USER_CONFIG) ) {
      let config = JSON.parse(fs.readFileSync(this.USER_CONFIG, 'utf-8'));
      if ( config.user ) {
        delete config.user;
        fs.writeFileSync(this.USER_CONFIG, JSON.stringify(config, null, 2));
      }
    }
    if ( this._CONFIG.user ) {
      delete this._CONFIG.user;
    }
    if ( this._CONFIG._user ) {
      delete this._CONFIG._user;
    }
  }


  /**
   * Parse the command line options (override from config files)
   */
  _parseOptions() {
    if ( global._program ) {

      // Parse plain & styled flags
      if ( global._program.color ) {
        this._CONFIG.plain = false;
        delete global._program.color;
      }
      if ( global._program.plain ) {
        this._CONFIG.plain = true;
        delete global._program.plain;
      }

      // Parse completed
      let completed = global._program.completed === undefined ? this._CONFIG.completed : global._program.completed;
      if ( completed.toString().toLowerCase() === 'true' ) {
        completed = true;
      }
      else if ( completed.toString().toLowerCase() === 'false' ) {
        completed = false;
      }
      else {
        completed = parseInt(completed);
      }
      this._CONFIG.completed = completed;

      // Parse hide due
      let hideDue = global._program.hideDue === undefined ? this._CONFIG.hideDue : global._program.hideDue;
      if ( hideDue.toString().toLowerCase() === 'false' ) {
        hideDue = false;
      }
      else {
        hideDue = parseInt(hideDue);
      }
      this._CONFIG.hideDue = hideDue;

      // Parse status
      if ( global._program.status ) {
        this._CONFIG.status = !this._CONFIG.status;
        delete global._program.status;
      }

    }
  }


  /**
   * Parse the Configuration properties
   * @private
   */
  _parseConfig() {

    // Reset CONFIG client and user
    delete this._CONFIG._client;
    delete this._CONFIG._user;

    // Set the RTM Client
    if ( this._CONFIG.client ) {
      this._CONFIG._client = new api(
        this._CONFIG.client.key,
        this._CONFIG.client.secret,
        this._CONFIG.client.perms
      );
    }

    // Set the RTM User, if present
    if ( this._CONFIG.user ) {
      try {
        this._CONFIG._user = this._CONFIG._client.user.import(this._CONFIG.user);
      }
      catch(exception) {}
    }

  }


}


module.exports = new Config();