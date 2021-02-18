const IMG_NAME_TEMPLATE = 'IMAGE_NAME';
const Application = {
  STORAGE_HOST: 'https://storage.googleapis.com',
  ELEM_SHOT_BUCKET: 'zl-elem-shots',
  PRODUCTION_API_BASE_URL: 'https://api.zylitics.io/beta',
  LOCAL_API_BASE_URL: 'http://localhost:8080/beta',
  IMG_NAME_TEMPLATE,
  STATIC_ASSETS_URL_TEMPLATE: `https://storage.googleapis.com/zl-front/${IMG_NAME_TEMPLATE}`,
  ZYLITICS_ADMIN_EMAILS: ['admin@zylitics.io', 'praveen@zylitics.io'],
};
export default Application;
