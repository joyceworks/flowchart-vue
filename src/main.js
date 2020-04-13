import Vue from 'vue';
import Antd from 'ant-design-vue';

import 'ant-design-vue/dist/antd.css';
import router from "./router";

Vue.config.productionTip = false;
Vue.use(Antd);

new Vue({
    el: '#app',
    router,
    mounted() {
        this.$on('login', async () => {
            let redirect = this.$route.query.redirect;
            this.$router.push(redirect || '/app/user');
        });
    }
});