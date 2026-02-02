// 弹出窗口的JavaScript逻辑

// 当弹出窗口加载完成时初始化
document.addEventListener("DOMContentLoaded", function () {
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
      console.error("加载设置时出错:", error)
    }
  }



  // 添加新的受限网站
  async function addSite() {
    const domain = siteInput.value.trim()
    const start = startTime.value
    const end = endTime.value

    // 输入验证
    if (!domain) {
      alert("请输入网站域名")
      return
    }

    if (!start || !end) {
      alert("请设置时间范围")
      return
    }

    // 获取选中的星期几
    const selectedDays = Array.from(dayButtons)
      .filter((btn) => btn.classList.contains("active"))
      .map((btn) => parseInt(btn.dataset.day))

    if (selectedDays.length === 0) {
      alert("请选择至少一个星期几")
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
        // 如果域名已存在，更新时间范围
        blockedSites[existingIndex] = newSite
      } else {
        // 添加新域名
        blockedSites.push(newSite)
      }

      // 保存到存储
      await chrome.storage.sync.set({ blockedSites: blockedSites })

      // 清空输入框
      siteInput.value = ""

      // 刷新显示
      displaySites(blockedSites)

      console.log("网站已添加:", cleanDomain)
    } catch (error) {
      console.error("添加网站时出错:", error)
      alert("添加网站时出错，请重试")
    }
  }

  // 显示网站列表
  function displaySites(sites) {
    if (!sites || sites.length === 0) {
      sitesList.innerHTML = '<div class="empty-state">暂无受限网站</div>'
      return
    }

    // 生成网站列表HTML（注意：移除了内联onclick事件）
    sitesList.innerHTML = sites
      .map((site) => {
        const schedule = site.timeRanges
          .map((range) => {
            const dayNames = [
              "周日",
              "周一",
              "周二",
              "周三",
              "周四",
              "周五",
              "周六",
            ]
            const daysText = range.days.map((day) => dayNames[day]).join(", ")
            return `${daysText} ${range.start}-${range.end}`
          })
          .join("; ")

        return `
                <div class="site-item">
                    <div class="site-info">
                        <div class="site-domain">${site.domain}</div>
                        <div class="site-schedule">${schedule}</div>
                    </div>
                    <button class="btn btn-danger" data-domain="${site.domain}">删除</button>
                </div>
            `
      })
      .join("")

    // 使用事件委托为删除按钮绑定事件处理器
    // 这种方式符合CSP规则，更安全也更高效
    bindDeleteButtons()
  }

  // 使用事件委托绑定删除按钮的点击事件
  function bindDeleteButtons() {
    // 移除之前的事件监听器，避免重复绑定
    sitesList.removeEventListener("click", handleDeleteClick)

    // 添加新的事件监听器
    sitesList.addEventListener("click", handleDeleteClick)
  }

  // 处理删除按钮点击事件的函数
  async function handleDeleteClick(event) {
    // 检查点击的是否是删除按钮
    if (event.target.classList.contains("btn-danger")) {
      const domain = event.target.getAttribute("data-domain")

      if (!domain) {
        console.error("无法获取要删除的域名")
        return
      }

      // 确认删除
      if (!confirm(`持久专注好处多多，但是贵在坚持，真的要解除对 ${domain} 的限制吗？`)) {
        return
      }

      try {
        const result = await chrome.storage.sync.get(["blockedSites"])
        const blockedSites = result.blockedSites || []

        // 移除指定域名
        const updatedSites = blockedSites.filter(
          (site) => site.domain !== domain
        )

        // 保存更新后的列表
        await chrome.storage.sync.set({ blockedSites: updatedSites })

        // 刷新显示
        displaySites(updatedSites)

        console.log("网站已删除:", domain)
      } catch (error) {
        console.error("删除网站时出错:", error)
        alert("删除网站时出错，请重试")
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
