// json to obj
export const jsonParse = (str: string) => {
  if (typeof str === "string") {
    try {
      return JSON.parse(str) || {};
    } catch (err) {
      console.warn("json parse error ", str);
      return {};
    }
  } else if (typeof str === "object") {
    return str;
  } else {
    console.warn("json parse error ", str);
    return {};
  }
}

export const isTrue = (field: any) => {
  return (
    String(field) === "true" || Number(field) === 1 || String(field) === "1"
  );
}

export const sleep = async (time?: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time || 1000);
  });
};
