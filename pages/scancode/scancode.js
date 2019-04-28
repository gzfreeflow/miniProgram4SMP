// pages/scancode/scancode.js
// 引入SDK核心类
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var coordtransform = require('../../utils/coord.js');
// 实例化API核心类
var qqmapsdk = new QQMapWX({
  key: 'HZ3BZ-764KU-EIEV3-4QKWC-7DWTK-UDBZF'
});
/**
 * 用户信息
 */
var token;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    devicesSets: [],
    dataPointTemplate: [],
    devId: '',
    devLongitude: 0,
    devLatitude: 0,
    devAddress: '',
    devName: '',
    setIndex: 0,
    templateIndex: 0,
    hasLocation: false,
    markers: [],
  },
  regionchange(e) {
    console.log(e.type)
  },
  markertap: function () {
    var that = this
    wx.chooseLocation({
      success: function (res) {
        // success
        console.log(res)
        that.setData({
          hasLocation: true,
          devLatitude: res.latitude,
          devLongitude: res.longitude,
          devAddress: res.address
        })
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })
  },
  bindDevicesSetChange: function (e) {
    console.log('picker devices set 发生选择改变，携带值为', e.detail.value);

    this.setData({
      setIndex: e.detail.value
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // 获取缓存中用户数据 同步的
    try {
      token = wx.getStorageSync('userinfo').data.token;
    } catch (e) {
      console.log('获取缓存失败' + e);
      wx.showToast({
        title: '获取缓存失败',
        icon: 'loading',
        duration: 2000
      });
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }
    that.getDevGroups();
    that.getDataPointTemplateList();
    that.getDevLocation();
    that.scanCode()
  },

  /**
   * 设备名称输入
   */
  nameInput: function (e) {
    this.setData({
      devName: e.detail.value
    })
  },

  /**
   * 设备id输入
   */
  devIdInput: function (e) {
    this.setData({
      devId: e.detail.value
    })
  },

  /**
   * 设备地址输入
   */
  addressInput: function (e) {
    this.setData({
      devAddress: e.detail.value
    })
  },

  /**
   * 重新扫码以及获取列表信息
   */
  reScanCode: function () {
    wx.reLaunch({
      url: '../../pages/scancode/scancode',
    })
  },

  /**
   * 获取当前位置
   */
  getDevLocation: function () {
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        var devLongitude = res.longitude;
        var devLatitude = res.latitude;
        var mks = [];
        mks.push({
          iconPath: '/images/monitor/pin.png',
          id: 0,
          latitude: devLatitude,
          longitude: devLongitude,
          width: 50,
          height: 50
        })
        that.setData({
          devLongitude: devLongitude,
          devLatitude: devLatitude,
          markers: mks
        })
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (addressRes) {
            var addressRes = addressRes.result;
            console.log(addressRes.address)
            that.setData({
              devAddress: addressRes.address
            })
          },
          fail: function (error) {
            console.log('获取地址失败');
          }
        })
      },
    })
  },

  /**
   * 添加设备
   */
  addDevice: function () {
    var that = this;
    var gcj02tobd09 = coordtransform.gcj02tobd09(that.data.devLongitude, that.data.devLatitude);
    var location = gcj02tobd09.toString();
    wx.request({
      url: 'https://cloudapi.usr.cn/usrCloud/dev/addDevice',
      method: "POST",
      data: {
        device: {
          deviceId: that.data.devId,
          groupId: that.data.devicesSets[that.data.setIndex].id,
          name: that.data.devName,
          type: 0,
          pollingInterval: 300,
          protocol: 0,
          address: that.data.devAddress,
          position: location
        },
        deviceSlaves: [{
          slaveIndex: 1,
          slaveName: '默认',
          slaveAddr: 2,
          dataTemplateId: that.data.dataPointTemplate[that.data.templateIndex].id
        }],
        token: token
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function(res){
        console.log(res)
        wx.switchTab({
          url: '../../pages/monitor/monitor',
        })
      }
    })
  },

  /**
   * 扫码
   */
  scanCode: function () {
    var that = this;
    wx.scanCode({
      success(res) {
        var devId = res.result;
        console.log(devId);
        that.setData({
          devId: devId
        });
      },
      fail(res) {
        console.log(res)
      },
    });
  },
  /**
   * 获取设备分组信息
   */
  getDevGroups: function () {
    var that = this
    wx.request({
      url: 'https://cloudapi.usr.cn/usrCloud/dev/getDevGroups',
      method: 'POST',
      data: {
        id: 0,
        sortByWeight: 'up',
        token: token
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        console.log(res);
        var devicesGroupList = res.data.data.groupList;
        var setsTitle = [];
        var sets = [];
        that.setData({
          devicesGroupList: devicesGroupList
        })
        // 判断是否有数据，有则取数据，否则添加至默认分组
        if (devicesGroupList.length != 0) {
          // 遍历所有设备分组列表
          for (var key in devicesGroupList) {
            // 取其中的title作为一个数组
            var groupTitle = devicesGroupList[key].title;
            var groupId = devicesGroupList[key].id;
            var groupParentId = devicesGroupList[key].parentId;
            var setInfo = {
              'parentId': groupParentId,
              'id': groupId,
              'title': groupTitle,
            };
            sets.push(setInfo);
            setsTitle.push(groupTitle)
          }
          that.setData({
            devicesSets: sets,
            devicesSetsTitle: setsTitle
          })
        } else {
          var groupTitle = '默认分组';
          var groupId = '';
          var groupParentId = 0;
          var devicesSetInfo = {
            'parentId': groupParentId,
            'id': groupId,
            'title': groupTitle,
          };
          sets.push(devicesSetInfo);
          setsTitle.push(groupTitle);
          that.setData({
            devicesSets: sets,
            devicesSetsTitle: setsTitle
          })
        }
      },
      fail: function (res) {
        wx.showToast({
          title: '获取设备分组信息失败，请重新登录后再试',
          icon: 'loading',
          duration: 5000
        });
      }
    })
  },
  /**
   * 获取数据模板
   */
  getDataPointTemplateList: function () {
    var that = this;
    wx.request({
      url: 'https://cloudapi.usr.cn/usrCloud/template/getDataPointTemplateList',
      method: 'POST',
      data: {
        page_param: {
          offset: 0,
          limit: 100
        },
        token: token
      },
      success: function (res) {
        console.log(res);
        var dataPointTemplateList = res.data.data.iotDatapointTemplateList;
        var templateNameArray = [];
        var template = [];
        that.setData({
          dataPointTemplateList: dataPointTemplateList
        })
        // 判断是否存在数据模板，有则取数据，无则添加后再试
        if (dataPointTemplateList.total != 0) {
          // 遍历所有数据模板列表
          for (var key in dataPointTemplateList) {
            // 取其中的title作为一个数组
            var templateName = dataPointTemplateList[key].templateName;
            var templateId = dataPointTemplateList[key].id;
            var templateInfo = {
              'id': templateId,
              'name': templateName,
            };
            template.push(templateInfo)
            templateNameArray.push(templateName)
          }
          that.setData({
            dataPointTemplate: template,
            dataPointTemplateName: templateNameArray
          })
        } else {
          wx.showToast({
            title: '当前用户未查有数据模板，请在网页端添加后再试',
            icon: 'loading',
            duration: 5000
          });
        }
      },
      fail: function (res) {
        wx.showToast({
          title: '获取模板列表信息失败，请重新登录后再试',
          icon: 'loading',
          duration: 5000
        });
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})