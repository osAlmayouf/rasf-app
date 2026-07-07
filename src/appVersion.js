/* eslint-disable no-undef */
// __APP_VERSION__ يُحقن وقت البناء من package.json (vite.config.js → define)
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
