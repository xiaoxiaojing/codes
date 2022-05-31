
/**
 * 清理对象
 * @param obj 原始对象
 * @returns 去掉属性值为undefined、空对象、空数组后的对象
 */
export const cleanObj = <T extends Object>(obj: T): T => {
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const value = obj[key];
    if (value === undefined) {
      return acc;
    }

    if (Array.isArray(value) && value.length === 0) {
      return acc;
    }
    
    // 使用Object.prototype.toString判断值的类型更准确
    if (
      Object.prototype.toString.call(value) === "[object Object]" &&
      Object.keys(value).length === 0
    ) {
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};
