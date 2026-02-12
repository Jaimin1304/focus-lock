// blocked.js - 阻止页面的JavaScript逻辑

// 应用国际化翻译
applyI18n()

// 显示当前时间
function updateTime() {
  const now = new Date()
  const timeString = now.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  document.getElementById("currentTime").textContent = timeString
}

// 每秒更新时间
updateTime()
setInterval(updateTime, 1000)

// 励志语录 — 从 i18n 消息中加载
const quoteKeys = [
  "quote1", "quote2", "quote3", "quote4", "quote5", "quote6",
  "quote7", "quote8", "quote9", "quote10", "quote11", "quote12", "quote13",
]

// 随机显示励志语录
function showRandomQuote() {
  const key = quoteKeys[Math.floor(Math.random() * quoteKeys.length)]
  document.getElementById("motivationalQuote").textContent =
    `"${t(key)}"`
}

// 初始显示随机语录
showRandomQuote()

// 每30秒更换一次语录
setInterval(showRandomQuote, 30000)

// 防止用户尝试通过开发者工具绕过阻止
document.addEventListener("contextmenu", function (e) {
  e.preventDefault()
})

// 阻止一些常见的绕过快捷键
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
    e.preventDefault()
  }
  if (e.key === "F12") {
    e.preventDefault()
  }
  if (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I")) {
    e.preventDefault()
  }
})
