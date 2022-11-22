// 定义
class AsyncSleep {
  constructor(timeout) {
    this.timeout = timeout;
  }
  then(resolve) {
    const startTime = Date.now();
    setTimeout(() => {
      resolve(Date.now() - startTime);
    }, this.timeout);
  }
}

// 使用
(async () => {
  const actualTime = await new AsyncSleep(1000);
  console.log(actualTime);
})();
