/**
 * 数组去重
 * @param arr 原数组
 * @param key 判断重复的key或方法
 * @returns 去重后的数组
 */
export function unique<T>(
  arr: T[],
  key: string | ((item: T) => string | number)
) {
  if (!arr) return arr;
  if (key === undefined) return [...new Set(arr)];
  
  // 获取判断是否重复的函数
  const fn = typeof key === "function" ? (item: T) => key(item) : (item: T) => item[key];
  // 以空间换时间，使用额外的变量obj来去重，同时保证数组的顺序
  const obj: { [key: string]: boolean } = {};
  const newArr = arr
    .map((item) => {
      const value = fn(item);
      if (obj[value]) {
        return undefined;
      }
      obj[value] = true;
      return item;
    })
    .filter((item) => !!item);

  return newArr as T[];
}
