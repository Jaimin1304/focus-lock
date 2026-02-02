// 后台脚本 - 监听标签页变化并检查是否需要阻止访问

// 当标签页更新时触发（包括导航到新URL）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 方法1：在URL变化时立即检查（最快响应）
  // 这样可以在页面开始加载时就进行拦截
  if (changeInfo.url) {
    checkAndBlockSite(changeInfo.url, tabId)
  }

  // 方法2：在页面加载状态为'loading'时也检查
  // 这是备用检查，确保不会漏掉任何情况
  if (changeInfo.status === "loading" && tab.url) {
    checkAndBlockSite(tab.url, tabId)
  }

  // 方法3：保留原有的完成时检查作为最后保险
  // 这样可以处理一些特殊情况，比如单页应用的路由变化
  if (changeInfo.status === "complete" && tab.url) {
    checkAndBlockSite(tab.url, tabId)
  }
})

// 当激活不同标签页时也检查
// 这个处理的是用户在不同标签页之间切换的情况
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkAndBlockSite(tab.url, activeInfo.tabId)
    }
  })
})

// 新增：监听标签页创建事件
// 这个处理的是用户打开新标签页直接访问受限网站的情况
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url && tab.url !== "chrome://newtab/") {
    checkAndBlockSite(tab.url, tab.id)
  }
})

// 核心函数：检查网站是否应该被阻止
async function checkAndBlockSite(url, tabId) {
  try {
    // 跳过chrome内部页面和扩展页面
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      return
    }

    // 从存储中获取用户设置
    const result = await chrome.storage.sync.get(["blockedSites"])
    const blockedSites = result.blockedSites || []

    // 检查当前网站是否在阻止列表中
    const currentDomain = extractDomain(url)
    const blockedSite = blockedSites.find(
      (site) =>
        site.domain === currentDomain || currentDomain.includes(site.domain)
    )

    if (blockedSite) {
      // 检查当前时间是否在限制时段内
      if (isInRestrictedTime(blockedSite.timeRanges)) {
        // 重定向到阻止页面
        const blockedUrl =
          chrome.runtime.getURL("blocked.html") +
          "?site=" +
          encodeURIComponent(currentDomain)
        chrome.tabs.update(tabId, { url: blockedUrl })
      }
    }
  } catch (error) {
    console.error("检查网站时出错:", error)
  }
}

// 从URL中提取域名
function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace("www.", "")
  } catch (error) {
    return ""
  }
}

// 检查当前时间是否在限制时段内
function isInRestrictedTime(timeRanges) {
  if (!timeRanges || timeRanges.length === 0) {
    return false
  }

  const now = new Date()
  const currentDay = now.getDay() // 0=周日, 1=周一, ..., 6=周六
  const currentTime = now.getHours() * 60 + now.getMinutes() // 转为分钟数

  return timeRanges.some((range) => {
    // 检查是否在指定的星期几
    if (range.days && !range.days.includes(currentDay)) {
      return false
    }

    // 转换时间格式 "HH:MM" 为分钟数
    const startMinutes = timeToMinutes(range.start)
    const endMinutes = timeToMinutes(range.end)

    // 检查是否在时间范围内
    if (startMinutes <= endMinutes) {
      // 正常情况：开始时间 <= 结束时间
      return currentTime >= startMinutes && currentTime <= endMinutes
    } else {
      // 跨天情况：如 23:00 到 01:00
      return currentTime >= startMinutes || currentTime <= endMinutes
    }
  })
}

// 将时间字符串转换为分钟数
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log("Focus Lock 插件已安装")
})
