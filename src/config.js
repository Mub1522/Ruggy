const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Cached configuration to avoid repeated file system lookups
 * @type {Object|null}
 */
let cachedConfig = null;

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    dataPath: './data'
};

/**
 * Searches for ruggy.yaml starting from current directory up to root
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} - Path to ruggy.yaml or null if not found
 */
function findConfigFile(startDir = process.cwd()) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;

    while (true) {
        const configPath = path.join(currentDir, 'ruggy.yaml');

        if (fs.existsSync(configPath)) {
            return configPath;
        }

        // Check for .yml variant
        const altConfigPath = path.join(currentDir, 'ruggy.yml');
        if (fs.existsSync(altConfigPath)) {
            return altConfigPath;
        }

        // Reached root without finding config
        if (currentDir === root) {
            return null;
        }

        // Move up one directory
        currentDir = path.dirname(currentDir);
    }
}

/**
 * Loads and parses ruggy.yaml configuration file
 * @param {string} configPath - Path to configuration file
 * @returns {Object} - Parsed configuration
 * @throws {Error} If file cannot be read or parsed
 */
function parseConfigFile(configPath) {
    try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(fileContents);

        if (!config || typeof config !== 'object') {
            throw new Error('Configuration must be a valid YAML object');
        }

        return config;
    } catch (error) {
        throw new Error(`Failed to parse configuration file at '${configPath}': ${error.message}`);
    }
}

/**
 * Loads Ruggy configuration from ruggy.yaml or returns defaults
 * Configuration is cached after first load
 * @param {Object} options - Options
 * @param {boolean} options.reload - Force reload configuration (bypass cache)
 * @param {string} options.searchFrom - Directory to start searching from (default: process.cwd())
 * @returns {Object} - Configuration object
 */
function loadConfig(options = {}) {
    const { reload = false, searchFrom = process.cwd() } = options;

    // Return cached config if available and not forcing reload
    if (cachedConfig && !reload) {
        return cachedConfig;
    }

    const configPath = findConfigFile(searchFrom);

    if (!configPath) {
        // No config file found, use defaults
        cachedConfig = { ...DEFAULT_CONFIG };
        return cachedConfig;
    }

    const userConfig = parseConfigFile(configPath);

    // Merge with defaults
    cachedConfig = {
        ...DEFAULT_CONFIG,
        ...userConfig
    };

    // Resolve relative paths to absolute based on config file location
    if (cachedConfig.dataPath && !path.isAbsolute(cachedConfig.dataPath)) {
        const configDir = path.dirname(configPath);
        cachedConfig.dataPath = path.resolve(configDir, cachedConfig.dataPath);
    }

    return cachedConfig;
}

/**
 * Clears the cached configuration
 * Useful for testing or when configuration changes at runtime
 */
function clearCache() {
    cachedConfig = null;
}

module.exports = {
    loadConfig,
    clearCache,
    DEFAULT_CONFIG
};
