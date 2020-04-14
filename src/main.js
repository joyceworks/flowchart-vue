import Vue from 'vue';
import Antd from 'ant-design-vue';
import App from './views/App';

import 'ant-design-vue/dist/antd.css';

Vue.config.productionTip = false;
Vue.use(Antd);

new Vue({
  el: '#app',
  mounted() {},
  components: {
    App
  }
});