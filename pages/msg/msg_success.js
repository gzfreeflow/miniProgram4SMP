// pages/msg/msg_success.js
Page({
  keepAdding: function () {
    wx.switchTab({
      url: '../../pages/scancode/scancode',
    })
  },
  checkList: function () {
    wx.switchTab({
      url: '../../pages/monitor/monitor',
    })
  }
})