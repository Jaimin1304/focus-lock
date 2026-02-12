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
