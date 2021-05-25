const IMG_NAME_TEMPLATE = 'IMAGE_NAME';
const Application = {
  ORG: 'Zylitics',
  STORAGE_HOST: 'https://storage.googleapis.com',
  ELEM_SHOT_BUCKET: 'zl-elem-shots',
  PRODUCTION_API_BASE_URL: 'https://front.api.zylitics.io/beta',
  LOCAL_API_BASE_URL: 'http://localhost:8080/beta',
  LOCAL_API_URL_TEMPLATE: 'http://HOST:8080/beta',
  IMG_NAME_TEMPLATE,
  STATIC_ASSETS_URL_TEMPLATE: `https://storage.googleapis.com/zl-front/${IMG_NAME_TEMPLATE}`,
  ZYLITICS_ADMIN_EMAILS: ['admin@zylitics.io', 'praveen@zylitics.io'],
  SUPPORT_EMAIL: 'support@zylitics.io',
  ABOUT_ZYLITICS_URL: 'https://about.zylitics.io',
  DOCS_ZYLITICS_URL: 'https://docs.zylitics.io',
  COMMUNITY_ZYLITICS_URL: 'https://community.zylitics.io',
  TERMS_PAGE: '/terms',
  PRIVACY_PAGE: '/privacy',
};
export default Application;
