# Flowchart

Flowchart & Flowchart designer component for Vue.js.

### Usage

```shell script
yarn add flowchart-vue
```

### Demo

1. First:

    ``` shell script
    yarn install
    yarn run serve
    ```

2. Then open http://localhost:port/#/app/index in browser.

### How To Use

```vue
<template>
    <div id="app">
        <flow-chart></flow-chart>
    </div>
</template>
<script>
  import Vue from 'vue';
  import FlowChart from 'flowchart-vue';

  Vue.use(FlowChart);

  export default {
    name: 'App',
  };
</script>
```
