// obj转化为url字符串
export const objToUrlParamString = (obj: Object) => {
  return Object.keys(obj)
    .map((key) => `${key}=${encodeURIComponent(obj[key])}`)
    .join("&");
};

// 拼参数
export const extendUrl = (originUrl: string, params: { [key: string]: any }) => {
  const connector = originUrl.indexOf("?") > -1 ? "&" : "?";
  return originUrl + connector + objToUrlParamString(params);
};

// 获取参数
const getUrlParamsMap = (url: string): { [key: string]: string } => {
  const result = {};
  const paramsString = url.split("?")[1];

  if (!paramsString) {
    return result;
  }

  paramsString.split("&").forEach((item) => {
    const [key, value] = item.split("=");
    result[key] = decodeURIComponent(value);
  });

  return result;
};
