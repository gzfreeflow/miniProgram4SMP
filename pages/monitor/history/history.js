// 载入echarts组件
import * as echarts from '../../../ec-canvas/echarts';

let that;
let data = [];

function setOption(chart) {
  var option = {
    title: {
      show: false,
    },
    dataZoom: [{
      show: true,
      start: 0,
      end: 100,
    },],
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        params = params[0];
        var date = new Date(params.name);
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' : ' + params.value[1];
      },
      axisPointer: {
        animation: false
      }
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false
      },
      axisTick: {
        inside: true
      }
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      },
      axisTick: {
        inside: true
      }
    },
    series: [{
      name: '历史数据的平滑曲线展示',
      type: 'line',
      lineStyle: {
        color: "#f12639"
      },
      showSymbol: false,
      smooth: true,
      data: data
    }]
  };

  chart.setOption(option);
  return chart;
}
Page({
  data: {
    token: '',
    deviceId: '',
    slaveIndex: '',
    dataPointId: '',
    dataPointName: '',
    startTime: Date.parse(new Date()) / 1000 - 10800,
    stopTime: Date.parse(new Date()) / 1000,
    ec: {
      // 将 lazyLoad 设为 true 后，需要手动初始化图表
      lazyLoad: true
    },
  },
  onReady: function () {
    // 获取组件
    this.echartsComponent = this.selectComponent('#mychart');
  },
  onLoad: function (options) {
    that = this;
    that.deviceId = options.deviceId;
    that.slaveIndex = options.slaveIndex;
    that.dataPointId = options.dataPointId;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          width: res.windowWidth,
          height: res.windowHeight
        })
      }
    })
    that.setData({
      deviceId: options.deviceId,
      slaveIndex: options.slaveIndex,
      dataPointId: options.dataPointId
    });
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          width: res.windowWidth,
          height: res.windowHeight
        })
      }
    });

    this.getData(0);
    this.getDataInfo()
  },
  getData(type) {
    wx.request({
      url: 'https://cloudapi.usr.cn/usrCloud/datadic/getMultiCurveDataPointHistory',
      method: 'POST',
      data: {
        token: wx.getStorageSync('token'),
        deviceDataPoints: [{
          deviceId: that.deviceId,
          slaveIndex: that.slaveIndex,
          dataPointId: that.dataPointId
        }],
        startTime: Date.parse(new Date()) / 1000 - (type == 0 ? 10800 : 86400),
        endTime: Date.parse(new Date()) / 1000
      },
      success: function (res) {
        data = [];
        for (let k in res.data.data[0].dataHistorys) {
          var date = new Date(res.data.data[0].dataHistorys[k].createTime * 1000);
          data.push({
            name: res.data.data[0].dataHistorys[k].deviceId,
            value: [date, res.data.data[0].dataHistorys[k].value]
          })
        }
        that.initChart();
      }
    });
  },
  getDataInfo: function () {
    var that = this
    wx.request({
      url: 'https://cloudapi.usr.cn/usrCloud/datadic/getData',
      method: 'POST',
      data: {
        token: wx.getStorageSync('token'),
        id: that.dataPointId
      },
      success: function (res) {
        var dataPointName = res.data.data.name
        that.setData({
          dataPointName: dataPointName
        })
      }
    })
  },
  bindPickerChange: function (res) {
    let startTime = '';
    if (res.detail.value == 0) {
      startTime = Date.parse(new Date()) / 1000 - 10800;
    } else {
      startTime = Date.parse(new Date()) / 1000 - 86400;
    }
    this.getData(res.detail.value);
  },
  initChart: function () {
    this.echartsComponent.init((canvas, width, height) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height
      });
      setOption(chart);
      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return chart;
    });
  },
});