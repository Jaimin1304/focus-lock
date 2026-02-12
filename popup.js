// popup.js - 弹出窗口的JavaScript逻辑

// 当弹出窗口加载完成时初始化
document.addEventListener("DOMContentLoaded", function () {
  // 应用国际化翻译
  applyI18n()

  // 获取DOM元素
  const siteInput = document.getElementById("siteInput")
  const startTime = document.getElementById("startTime")
  const endTime = document.getElementById("endTime")
  const addSiteBtn = document.getElementById("addSiteBtn")
  const sitesList = document.getElementById("sitesList")
  const dayButtons = document.querySelectorAll(".day-btn")

  // 初始化页面数据
  loadSettings()

  // 绑定事件监听器
  addSiteBtn.addEventListener("click", addSite)

  // 处理星期几选择按钮
  dayButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.classList.toggle("active")
    })
  })

  // 默认选中工作日（周一到周五）
  dayButtons.forEach((btn) => {
    const day = parseInt(btn.dataset.day)
    if (day >= 1 && day <= 5) {
      btn.classList.add("active")
    }
  })

  // ---- 时间输入框：鼠标滚轮调整逻辑 ----

  // 解析 "HH:MM" 字符串为 { hours, minutes }
  function parseTime(str) {
    const parts = str.split(":")
    return { hours: parseInt(parts[0]) || 0, minutes: parseInt(parts[1]) || 0 }
  }

  // 格式化为 "HH:MM"
  function formatTime(hours, minutes) {
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0")
  }

  // 处理滚轮事件
  function handleTimeWheel(e) {
    e.preventDefault()
    const input = e.target
    const cursorPos = input.selectionStart
    const { hours, minutes } = parseTime(input.value)

    // 判断光标在小时区域 (0,1,2) 还是分钟区域 (3,4)
    const isHours = cursorPos <= 2

    // 滚轮方向：deltaY < 0 = 向上滚 = 增加, deltaY > 0 = 向下滚 = 减少
    const delta = e.deltaY < 0 ? 1 : -1

    let newHours = hours
    let newMinutes = minutes

    if (isHours) {
      newHours = (hours + delta + 24) % 24
    } else {
      newMinutes = minutes + delta * 5
      if (newMinutes >= 60) newMinutes = 0
      if (newMinutes < 0) newMinutes = 55
    }

    input.value = formatTime(newHours, newMinutes)

    // 恢复光标位置，保持用户的选中区域
    requestAnimationFrame(() => {
      if (isHours) {
        input.setSelectionRange(0, 2)
      } else {
        input.setSelectionRange(3, 5)
      }
    })
  }

  // 点击时自动选中小时或分钟部分
  function handleTimeClick(e) {
    const input = e.target
    const cursorPos = input.selectionStart

    requestAnimationFrame(() => {
      if (cursorPos <= 2) {
        input.setSelectionRange(0, 2)
      } else {
        input.setSelectionRange(3, 5)
      }
    })
  }

  // 为两个时间输入框绑定事件
  ;[startTime, endTime].forEach((input) => {
    input.addEventListener("wheel", handleTimeWheel, { passive: false })
    input.addEventListener("click", handleTimeClick)
  })

  // 从存储中加载设置
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(["blockedSites"])

      // 显示已保存的网站列表
      displaySites(result.blockedSites || [])
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  // 添加新的受限网站
  async function addSite() {
    const domain = siteInput.value.trim()
    const start = startTime.value
    const end = endTime.value

    // 输入验证
    if (!domain) {
      alert(t("alertEnterDomain"))
      return
    }

    if (!start || !end) {
      alert(t("alertSetTime"))
      return
    }

    // 获取选中的星期几
    const selectedDays = Array.from(dayButtons)
      .filter((btn) => btn.classList.contains("active"))
      .map((btn) => parseInt(btn.dataset.day))

    if (selectedDays.length === 0) {
      alert(t("alertSelectDay"))
      return
    }

    // 清理域名格式
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")

    try {
      // 获取现有的网站列表
      const result = await chrome.storage.sync.get(["blockedSites"])
      const blockedSites = result.blockedSites || []

      // 检查是否已存在相同域名
      const existingIndex = blockedSites.findIndex(
        (site) => site.domain === cleanDomain
      )

      // 创建新的网站配置
      const newSite = {
        domain: cleanDomain,
        timeRanges: [
          {
            start: start,
            end: end,
            days: selectedDays,
          },
        ],
      }

      if (existingIndex >= 0) {
        blockedSites[existingIndex] = newSite
      } else {
        blockedSites.push(newSite)
      }

      // 保存到存储
      await chrome.storage.sync.set({ blockedSites: blockedSites })

      // 清空输入框
      siteInput.value = ""

      // 刷新显示
      displaySites(blockedSites)
    } catch (error) {
      console.error("Error adding site:", error)
      alert(t("alertAddError"))
    }
  }

  // 显示网站列表
  function displaySites(sites) {
    if (!sites || sites.length === 0) {
      sitesList.innerHTML = `<div class="empty-state">${t("emptyState")}</div>`
      return
    }

    const dayKeys = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"]

    sitesList.innerHTML = sites
      .map((site) => {
        const schedule = site.timeRanges
          .map((range) => {
            const daysText = range.days.map((day) => t(dayKeys[day])).join(", ")
            return `${daysText} ${range.start}-${range.end}`
          })
          .join("; ")

        return `
                <div class="site-item">
                    <div class="site-info">
                        <div class="site-domain">${site.domain}</div>
                        <div class="site-schedule">${schedule}</div>
                    </div>
                    <button class="btn btn-danger" data-domain="${site.domain}">${t("deleteBtn")}</button>
                </div>
            `
      })
      .join("")

    bindDeleteButtons()
  }

  // 使用事件委托绑定删除按钮的点击事件
  function bindDeleteButtons() {
    sitesList.removeEventListener("click", handleDeleteClick)
    sitesList.addEventListener("click", handleDeleteClick)
  }

  // 处理删除按钮点击事件的函数
  async function handleDeleteClick(event) {
    if (event.target.classList.contains("btn-danger")) {
      const domain = event.target.getAttribute("data-domain")

      if (!domain) return

      // 确认删除
      if (!confirm(t("confirmDelete", domain))) {
        return
      }

      try {
        const result = await chrome.storage.sync.get(["blockedSites"])
        const blockedSites = result.blockedSites || []

        const updatedSites = blockedSites.filter(
          (site) => site.domain !== domain
        )

        await chrome.storage.sync.set({ blockedSites: updatedSites })
        displaySites(updatedSites)
      } catch (error) {
        console.error("Error deleting site:", error)
        alert(t("alertDeleteError"))
      }
    }
  }

  // 回车键添加网站
  siteInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      addSite()
    }
  })
})
