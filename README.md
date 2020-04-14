# Flowchart

Flowchart & Flowchart designer component for Vue.js.

### Usage

```shell script
yarn add flowchart-vue
```

```vue
<template>
    <div id="app">
        <button type="button" @click="$refs.chart.add(10, 10)">
            Add
        </button>
        <button type="button" @click="$refs.chart.remove()">
            Del
        </button>
        <button type="button" @click="$refs.chart.edit()">
            Edit
        </button>
        <button type="button" @click="$refs.chart.save()">
            Save
        </button>
        <flow-chart :nodes="nodes" :connections="connections" @editnode="handleEditNode"
                    @editconnection="handleEditConnection" @save="handleChartSave" ref="chart">
        </flow-chart>
    </div>
</template>
<script>
  import Vue from 'vue';
  import FlowChart from 'flowchart-vue';

  Vue.use(FlowChart);

  export default {
    name: 'App',
    data: function() {
      return {
        nodes: [
          {id: 1, x: 140, y: 270, name: '开始', type: 'start'},
          {id: 2, x: 540, y: 270, name: '结束', type: 'end'},
        ],
        connections: [
          {
            source: {id: 1, position: 'right'},
            destination: {id: 2, position: 'left'},
            id: 1,
            type: 'pass',
          },
        ],
      };
    },
    methods: {
      handleChartSave(nodes, connections) {
      },
      handleEditNode(node) {
      },
      handleEditConnection(connection) {
      },
    }
  };
</script>
```

### Demo

1. First:

    ``` shell script
    yarn install
    yarn run serve
    ```

2. Then open http://localhost:port/#/ in browser.
