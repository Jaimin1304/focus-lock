// blocked.js - 阻止页面的JavaScript逻辑

// 显示当前时间
function updateTime() {
  const now = new Date()
  const timeString = now.toLocaleTimeString("zh-CN", {
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

// 励志语录数组
const motivationalQuotes = [
  {
    quote: "千里之行，始于足下。",
  },
  {
    quote: "不念过去，不忧未来，专注当下。",
  },
  {
    quote: "人愈思善，其世界愈善，整个世界亦然。",
  },
  {
    quote: "你掌控自己的心灵，而非外部事件。认识到这一点，你将找到力量。",
  },
  {
    quote: "静坐无事，春来草自生。",
  },
  {
    quote: "勿求事如己愿，但愿事如其然，则人生宁静流畅。",
  },
  {
    quote: "心静则万物归一。",
  },
  {
    quote: "禅定即是内在觉知心性之不动。",
  },
  {
    quote: "我们在想象中遭受的痛苦往往多于现实。",
  },
  {
    quote: "征服自我是第一且最好的胜利。",
  },
  {
    quote: "真正自由的人，是掌控自己的人。",
  },
  {
    quote: "心如止水，方能映照天地万物。",
  },
  {
    quote: "在善恶之中，心不起念，此谓之坐；在自性不动中，此谓之禅。",
  },
]

// 随机显示励志语录
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
  const randomQuote = motivationalQuotes[randomIndex]
  document.getElementById("motivationalQuote").textContent =
    `"${randomQuote.quote}"`
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
