/**
 * @date 2022-03-29
 * @author tj
 * @description FIFO队列，满足几个条件
 * 1、可迭代对象
 * 2、有入队列和出队列方法
 * 3、有length属性
 */
export class ArrayQueue<T> {
  private _list: T[];
  private _listReversed: T[];

  constructor(items?: T[]) {
    this._list = items || [];
    this._listReversed = [];
  }

  private _indexOf(item: T, arr: T[]) {
    if (item instanceof Object) {
      const key = "key";
      return arr.findIndex((arrItem) => arrItem[key] == item[key]);
    } else {
      return arr.indexOf(item);
    }
  }

  get length() {
    return this._list.length + this._listReversed.length;
  }

  clear() {
    this._list.length = 0;
    this._listReversed.length = 0;
  }

  enqueue(item: T) {
    this._list.push(item);
  }

  dequeue() {
    if (this._listReversed.length === 0) {
      if (this._list.length === 0) return undefined;
      if (this._list.length === 1) return this._list.pop();
      // 性能优化，shift操作比reverse+pop耗时
      if (this._list.length < 16) return this._list.shift();
      this._listReversed = this._list;
      this._listReversed.reverse();
      this._list = [];
    }

    return this._listReversed.pop();
  }

  delete(item: T) {
    const i = this._indexOf(item, this._list);
    if (i >= 0) {
      this._list.splice(i, 1);
    } else {
      const i = this._indexOf(item, this._listReversed);
      if (i >= 0) {
        this._listReversed.splice(i, 1);
      }
    }
  }

  // 声明其为一个可迭代对象，可以通过for..of进行遍历
  *[Symbol.iterator]() {
    for (let j = this._listReversed.length - 1; j >= 0; j--) {
      yield this._listReversed[j];
    }
    for (let i = 0; i < this._list.length; i++) {
      yield this._list[i];
    }
  }
}
