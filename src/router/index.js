import Vue from 'vue';
import VueRouter from 'vue-router';
import App from '../views/App';

import FlowChart from '../components/flowchart/Flowchart';
import Detail from '../views/Demo';

Vue.use(VueRouter);

const routes = [
  {
    path: '/app', component: App, children: [
      {path: 'index', component: Detail},
      {path: 'component/flowchart', component: FlowChart},
    ],
  },
];

let router = new VueRouter({
  routes,
});
export default router;