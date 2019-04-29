// pages/msg/msg_fail.js
Page({
  reScan: function () {
    wx.switchTab({
      url: '../../pages/scancode/scancode',
    })
  },
  checkUserInfo: function () {
    wx.switchTab({
      url: '../../pages/user/user',
    })
  }
})