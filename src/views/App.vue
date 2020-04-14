<template>
    <div style="height: calc(100% - 50px)">
        <div id="toolbar">
            <a-button-group>
                <a-button @click="$refs.chart.add(10, 10)">
                    添加
                </a-button>
                <a-button @click="$refs.chart.remove()">
                    删除
                </a-button>
                <a-button @click="$refs.chart.edit()">
                    编辑
                </a-button>
                <a-button @click="$refs.chart.save()">
                    保存
                </a-button>
            </a-button-group>
        </div>
        <flow-chart :nodes="nodes" :connections="connections" @editnode="handleEditNode"
                    :width="'100%'" :height="'100%'"
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
        let data = nodes.map(node => {
          let result = {
            id: node.id,
            x: node.x || 0,
            y: node.y || 0,
            name: node.name,
            state: node.type,
            approvers: node.approvers,
            processDefinitionId: this.$route.query.id,
          };
          result.transitions = connections.filter(conn => conn.source.id === node.id).map(conn => {
            return {
              source: conn.source.id,
              destination: conn.destination.id,
              type: conn.type,
              sourcePosition: conn.source.position,
              destinationPosition: conn.destination.position,
              name: conn.name,
              expression: conn.expression,
            };
          });
          return result;
        });
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
</style>