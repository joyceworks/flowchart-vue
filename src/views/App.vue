<template>
    <div class="container">
        <h1 class="title">Flowchart Vue</h1>
        <h5 class="subtitle">Flowchart & Flowchart designer component for Vue.js.</h5>
        <div id="toolbar">
            <button @click="$refs.chart.add(10, 10)">Add(Double-click canvas)</button>
            <button @click="$refs.chart.remove()">Delete(Del)</button>
            <button @click="$refs.chart.editCurrent()">Edit(Double-click node)</button>
            <button @click="$refs.chart.save()">Save</button>
        </div>
        <flowchart :nodes="nodes" :connections="connections" @editnode="handleEditNode"
                   :width="'100%'" :height="500" :readonly="false"
                   @editconnection="handleEditConnection" @save="handleChartSave" ref="chart">
        </flowchart>
        <node-dialog :visible.sync="nodeDialogVisible" :node.sync="nodeForm.target"></node-dialog>
        <connection-dialog :visible.sync="connectionDialogVisible"
                           :connection.sync="connectionForm.target"
                           :operation="connectionForm.operation">
        </connection-dialog>
    </div>
</template>
<script>

  import ConnectionDialog from '../components/ConnectionDialog';
  import NodeDialog from '../components/NodeDialog';
  import Flowchart from '../components/flowchart/Flowchart';

  export default {
    components: {
      ConnectionDialog, NodeDialog, Flowchart,
    },
    data: function() {
      return {
        nodes: [
          {id: 1, x: 50, y: 220, name: 'Start', type: 'start'},
          {id: 2, x: 630, y: 220, name: 'End', type: 'end'},
          {
            id: 3,
            x: 340,
            y: 130,
            name: 'Operation',
            type: 'operation',
            approvers: [{id: 1, name: 'Joyce'}],
          },
          {
            id: 4,
            x: 240,
            y: 220,
            name: 'Operation',
            type: 'operation',
            approvers: [{id: 2, name: 'Allen'}],
          },
          {
            id: 5,
            x: 440,
            y: 220,
            name: 'Operation',
            type: 'operation',
            approvers: [{id: 3, name: 'Teresa'}],
          },
        ],
        connections: [
          {
            source: {id: 1, position: 'right'},
            destination: {id: 4, position: 'left'},
            id: 1,
            type: 'pass',
          },
          {
            source: {id: 4, position: 'right'},
            destination: {id: 5, position: 'left'},
            id: 2,
            type: 'pass',
          },
          {
            source: {id: 5, position: 'right'},
            destination: {id: 2, position: 'left'},
            id: 3,
            type: 'pass',
          },
          {
            source: {id: 5, position: 'bottom'},
            destination: {id: 4, position: 'bottom'},
            id: 4,
            type: 'reject',
          },
          {
            source: {id: 1, position: 'top'},
            destination: {id: 3, position: 'left'},
            id: 5,
            type: 'pass',
          },
          {
            source: {id: 3, position: 'right'},
            destination: {id: 2, position: 'top'},
            id: 6,
            type: 'pass',
          },
        ],
        nodeForm: {target: null},
        connectionForm: {target: null, operation: null},
        nodeDialogVisible: false,
        connectionDialogVisible: false,
      };
    },
    async mounted() {
    },
    methods: {
      async handleChartSave(nodes, connections) {
        // axios.post(url, {nodes, connection}).then(resp => {
        //   this.nodes = resp.nodes;
        //   this.connections = resp.connections;
        //   // Flowchart will refresh after this.nodes and this.connections changed
        // });
      },
      handleEditNode(node) {
        this.nodeForm.target = node;
        this.nodeDialogVisible = true;
      },
      handleEditConnection(connection) {
        this.connectionForm.target = connection;
        this.connectionDialogVisible = true;
      },
    },
  };
</script>
<style scoped>
    #toolbar {
        margin-bottom: 10px;
    }

    .title {
        margin-top: 10px;
        margin-bottom: 0;
    }

    .subtitle {
        margin-bottom: 10px;
    }

    #toolbar > button {
        margin-right: 4px;
    }

    .container {
        width: 800px;
        margin: auto;
    }
</style>