<template>
    <div style="height: calc(100% - 50px); padding: 10px;">
        <div id="toolbar">
            <button @click="$refs.chart.add(10, 10)">
                Add(Double-click canvas)
            </button>
            <button @click="$refs.chart.remove()">
                Delete(Del)
            </button>
            <button @click="$refs.chart.editCurrent()">
                Edit(Double-click node)
            </button>
            <button @click="$refs.chart.save()">
                Save
            </button>
        </div>
        <flow-chart :nodes="nodes" :connections="connections" @editnode="handleEditNode"
                    :width="'100%'" :height="'100%'" :readonly="true"
                    @editconnection="handleEditConnection" @save="handleChartSave" ref="chart">
        </flow-chart>
        <flow-chart-node-dialog :visible.sync="nodeDialogVisible"
                                :node.sync="editingInfo.target">
        </flow-chart-node-dialog>
        <flow-chart-connection-dialog :visible.sync="connectionDialogVisible"
                                      :connection.sync="connectionEditingInfo.target"
                                      :operation="connectionEditingInfo.operation">
        </flow-chart-connection-dialog>
    </div>
</template>
<script>

  import FlowChartConnectionDialog from '../components/ConnectionDialog';
  import FlowChartNodeDialog from '../components/NodeDialog';
  import FlowChart from '../components/flowchart/Flowchart';

  export default {
    components: {
      FlowChartConnectionDialog, FlowChartNodeDialog, FlowChart,
    },
    data: function() {
      return {
        nodes: [
          {id: 1, x: 140, y: 270, name: 'Start', type: 'start'},
          {id: 2, x: 540, y: 270, name: 'End', type: 'end'},
          {id: 3, x: 340, y: 180, name: 'Operation', type: 'operation'},
        ],
        connections: [
          {
            source: {id: 1, position: 'right'},
            destination: {id: 2, position: 'left'},
            id: 1,
            type: 'pass',
          },
          {
            source: {id: 1, position: 'top'},
            destination: {id: 3, position: 'left'},
            id: 2,
            type: 'pass',
          },
          {
            source: {id: 3, position: 'right'},
            destination: {id: 2, position: 'top'},
            id: 3,
            type: 'pass',
          },
        ],
        editingInfo: {target: null},
        connectionEditingInfo: {target: null, operation: null},
        nodeDialogVisible: false,
        connectionDialogVisible: false,
      };
    },
    async mounted() {
    },
    methods: {
      async handleChartSave(nodes, connections) {
      },
      handleEditNode(node) {
        this.editingInfo.target = node;
        this.nodeDialogVisible = true;
      },
      handleEditConnection(connection) {
        this.connectionEditingInfo.target = connection;
        this.connectionDialogVisible = true;
      },
    },
  };
</script>
<style scoped>
    #toolbar {
        margin-bottom: 10px;
    }

    #toolbar > button {
        margin-right: 4px;
    }
</style>