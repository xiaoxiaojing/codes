// 加载script
export const loadScript = (url: string, callback?: any) => {
  callback = typeof callback === "function" ? callback : function () {};
  var head = document.getElementsByTagName("head")[0];
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  script.onload = callback;
  head.appendChild(script);
}
