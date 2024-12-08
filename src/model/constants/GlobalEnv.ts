const prefix = "envs.";

/**
 * Env to be used in `@Constant` decorators
 */
enum GlobalEnv {
    PORT = `${prefix}PORT`,
    SESSION_KEY = `${prefix}SESSION_KEY`,
    HTTPS = `${prefix}HTTPS`,
    HTTPS_PORT = `${prefix}HTTPS_PORT`,
    ALLOWED_FILES = `${prefix}ALLOWED_FILES`,
    ALLOWED_FILES_ZIP = `${prefix}ALLOWED_FILES_ZIP`,
    ALLOWED_HEADERS = `${prefix}ALLOWED_HEADERS`,
    ALLOWED_HEADERS_ZIP = `${prefix}ALLOWED_HEADERS_ZIP`,
    NODE_ENV = `${prefix}NODE_ENV`,
    BASE_URL = `${prefix}BASE_URL`,
    HELP_EMAIL = `${prefix}HELP_EMAIL`,
    BOT_URI = `${prefix}BOT_URI`,
    CAPTCHA_SITE_KEY = `${prefix}CAPTCHA_SITE_KEY`,
    CAPTCHA_SECRET_KEY = `${prefix}CAPTCHA_SECRET_KEY`,
    FILE_SIZE_UPLOAD_LIMIT_MB = `${prefix}FILE_SIZE_UPLOAD_LIMIT_MB`,
    SMTP_HOST = `${prefix}SMTP_HOST`,
    SMTP_PORT = `${prefix}SMTP_PORT`,
    SMTP_SECURE = `${prefix}SMTP_SECURE`,
    SMTP_USER = `${prefix}SMTP_USER`,
    SMTP_PASS = `${prefix}SMTP_PASS`,
    SMTP_FROM = `${prefix}SMTP_FROM`,
    REPLY_TO = `${prefix}REPLY_TO`,
    RATE_LIMIT = `${prefix}RATE_LIMIT`,
    RATE_LIMIT_MS = `${prefix}RATE_LIMIT_MS`,
    REDIS_URI = `${prefix}REDIS_URI`,
}

export default GlobalEnv;
