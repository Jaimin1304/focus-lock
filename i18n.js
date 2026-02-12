// i18n.js - 国际化辅助函数

// 将页面中所有带 data-i18n 属性的元素替换为对应的翻译文本
function applyI18n() {
  // 替换 textContent
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n")
    const msg = chrome.i18n.getMessage(key)
    if (msg) el.textContent = msg
  })

  // 替换 placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder")
    const msg = chrome.i18n.getMessage(key)
    if (msg) el.placeholder = msg
  })

  // 替换 title
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title")
    const msg = chrome.i18n.getMessage(key)
    if (msg) document.title = msg
  })
}

// 获取翻译文本的快捷函数
function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key
}
