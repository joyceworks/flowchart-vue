<template>
    <div id="chart"
         :style="{width: isNaN(width) ? width : (width + 'px'), height: isNaN(height) ? height : (height + 'px'), cursor: cursor}"
         @mousemove="handleChartMouseMove"
         @mouseup="handleChartMouseUp"
         @dblclick="handleChartDblClick($event)"
    >
        <span id="position">{{ cursorToChartOffset.x + ', ' + cursorToChartOffset.y }}</span>
        <svg style="width: 100%; height: 100%;" id="svg"></svg>
    </div>
</template>
<script>
  import {lineTo, line2} from '../../utils/svg';
  import '../../assets/flowchart.css';
  import * as d3 from 'd3';
  import {between, distanceOfPointToLine} from '../../utils/math';

  export default {
    name: 'flow-chart',
    props: {
      nodes: {
        type: Array,
        default: () => [
          {id: 1, x: 140, y: 270, name: '开始', type: 'start'},
          {id: 2, x: 540, y: 270, name: '结束', type: 'end'},
        ],
      },
      connections: {
        type: Array,
        default: () => [
          {
            source: {id: 1, position: 'right'},
            destination: {id: 2, position: 'left'},
            id: 1,
            type: 'pass',
          },
        ],
      },
      width: {
        type: [String, Number],
        default: 800,
      },
      height: {
        type: [String, Number],
        default: 600,
      },
    },
    data() {
      return {
        internalNodes: [],
        internalConnections: [],
        movingInfo: {offsetX: null, offsetY: null},
        connectingInfo: {
          source: null,
          sourcePosition: null,
        },
        currentNode: null,
        currentConnection: null,
        /**
         * Mouse position(relative to chart div)
         */
        cursorToChartOffset: {x: 0, y: 0},
        clickedOnce: false,
        /**
         * lines of all internalConnections
         */
        lines: [],
      };
    },
    methods: {
      add(x, y) {
        this.internalNodes.push({id: +new Date(), x: x, y: y, name: '新建节点', type: 'operation'});
      },
      edit() {
        if (this.currentNode) {
          this.$emit('editnode', this.currentNode);
        } else if (this.currentConnection) {
          this.$emit('editconnection', this.currentConnection);
        }
      },
      async handleChartMouseUp() {
        if (this.movingInfo.target) {
          this.movingInfo.target.x =
              Math.round(Math.round(this.movingInfo.target.x) / 10) * 10;
          this.movingInfo.target.y =
              Math.round(Math.round(this.movingInfo.target.y) / 10) * 10;
          this.movingInfo.target = null;
          this.movingInfo.offsetX = null;
          this.movingInfo.offsetY = null;
          let that = this;
          await that.refresh();
          return;
        }

        if (this.connectingInfo.source) {
          if (this.hoveredConnector) {
            if (this.connectingInfo.source.id !== this.hoveredConnector.node.id) {
              // Node can't connect to itself
              let tempId = +new Date();
              let conn = {
                source: {
                  id: this.connectingInfo.source.id,
                  position: this.connectingInfo.sourcePosition,
                },
                destination: {
                  id: this.hoveredConnector.node.id,
                  position: this.hoveredConnector.position,
                },
                id: tempId,
                type: 'pass',
                name: '通过',
              };
              this.internalConnections.push(conn);
              this.refresh();
            }
          }
          this.connectingInfo.source = null;
          this.connectingInfo.sourcePosition = null;
        }
      },
      async handleChartMouseMove(event) {
        let boundingClientRect = event.currentTarget.getBoundingClientRect();
        this.cursorToChartOffset.x = event.pageX - boundingClientRect.left - window.scrollX;
        this.cursorToChartOffset.y = event.pageY - boundingClientRect.top - window.scrollY;
        if (this.connectingInfo.source) {
          await this.refresh();
          let sourceOffset = this.getNodeConnectorOffset(
              this.connectingInfo.source.id,
              this.connectingInfo.sourcePosition,
          );
          let destinationPosition = this.hoveredConnector ? this.hoveredConnector.position : null;
          this.arrowTo(sourceOffset.x, sourceOffset.y, this.cursorToChartOffset.x,
              this.cursorToChartOffset.y, this.connectingInfo.sourcePosition, destinationPosition,
          );
        } else {
          await this.refresh();
        }
      },
      handleChartDblClick(event) {
        this.add(event.offsetX, event.offsetY);
        this.refresh();
      },
      getConnectorPosition(node) {
        let top = {x: node.x + 60, y: node.y};
        let left = {x: node.x, y: node.y + 30};
        let bottom = {x: node.x + 60, y: node.y + 60};
        let right = {x: node.x + 120, y: node.y + 30};
        return {left, right, top, bottom};
      },
      editConnection(conn) {
        this.$emit('editconnection', conn);
      },
      refresh() {
        let that = this;
        return new Promise(function(resolve) {
          that.$nextTick(function() {
            d3.selectAll('svg > *').remove();

            let connectorVisible = that.connectingInfo.source || that.hoveredNode;
            // render nodes
            that.internalNodes.forEach(node => {
              if (node === that.currentNode) {
                that.renderNode(node, '#666666', connectorVisible);
              } else {
                that.renderNode(node, '#bbbbbb', connectorVisible);
              }
            });

            // render lines
            that.lines = [];
            that.internalConnections.forEach(conn => {
              let sourcePosition = that.getNodeConnectorOffset(
                  conn.source.id,
                  conn.source.position,
              );
              let destinationPosition = that.getNodeConnectorOffset(
                  conn.destination.id,
                  conn.destination.position,
              );
              let colors = {
                pass: '#52c41a',
                reject: 'red',
              };
              if (conn === that.currentConnection) {
                colors = {
                  pass: '#12640a',
                  reject: 'darkred',
                };
              }
              let result = that.arrowTo(
                  sourcePosition.x,
                  sourcePosition.y,
                  destinationPosition.x,
                  destinationPosition.y,
                  conn.source.position,
                  conn.destination.position,
                  colors[conn.type],
              );
              for (const path of result.paths) {
                path.on('click', function() {
                  that.currentNode = null;
                  that.currentConnection = conn;
                  that.refresh();
                });
                path.on('dblclick', function() {
                  that.editConnection(conn);
                });
              }
              for (const line of result.lines) {
                that.lines.push({
                  sourceX: line.sourceX,
                  sourceY: line.sourceY,
                  destinationX: line.destinationX,
                  destinationY: line.destinationY,
                  id: conn.id,
                });
              }
            });
            resolve();
          });
        });
      },
      getNodeConnectorOffset(nodeId, connectorPosition) {
        let node = this.internalNodes.filter(item => item.id === nodeId)[0];
        return this.getConnectorPosition(node)[connectorPosition];
      },
      lineTo(x1, y1, x2, y2, dash) {
        lineTo('svg', x1, y1, x2, y2, 1, '#a3a3a3', dash);
      },
      arrowTo(x1, y1, x2, y2, startPosition, endPosition, color) {
        line2('svg', x1, y1, x2, y2, startPosition, endPosition, 1, color || '#a3a3a3', true);
        return line2('svg', x1, y1, x2, y2, startPosition, endPosition, 5, 'transparent', false);
      },
      renderNode(node, borderColor, connectorVisible) {
        let that = this;
        let svg = d3.select('#svg');
        svg.append('rect').
            attr('x', node.x).
            attr('y', node.y).
            attr('width', 120).
            attr('height', 20).
            attr('stroke', borderColor).
            attr('stroke-width', '1px').
            attr('fill', '#f1f3f4');
        svg.append('text').
            attr('x', node.x + 4).
            attr('y', node.y + 15).
            attr('class', 'unselectable').
            text(function() {return node.name;}).each(function wrap() {
          let self = d3.select(this),
              textLength = self.node().getComputedTextLength(),
              text = self.text();
          while (textLength > (120 - 2 * 4) && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '...');
            textLength = self.node().getComputedTextLength();
          }
        });
        let text = node.type === 'start' ? '提交' : (node.type === 'end' ? '完成' : (
                (!node.approvers || node.approvers.length === 0) ? '无审批人' : (
                    node.approvers.length > 1 ? `${node.approvers[0].name}等` :
                        node.approvers[0].name
                )
            )
        );
        svg.append('rect').
            attr('x', node.x).
            attr('y', node.y + 20).
            attr('width', 120).
            attr('height', 40).
            attr('stroke', borderColor).
            attr('stroke-width', '1px').
            attr('fill', 'white');
        svg.append('text').
            attr('x', node.x + 60).
            attr('y', node.y + 45).
            attr('class', 'unselectable').
            attr('text-anchor', 'middle').
            text(function() {return text;}).each(function wrap() {
          let self = d3.select(this),
              textLength = self.node().getComputedTextLength(),
              text = self.text();
          while (textLength > (120 - 2 * 4) && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '...');
            textLength = self.node().getComputedTextLength();
          }
        });
        let drag = d3.drag().
            on('start', function() {
              that.currentConnection = null;
              that.currentNode = node;
              if (that.clickedOnce) {
                that.$emit('editnode', node);
              } else {
                let timer = setTimeout(function() {
                  that.clickedOnce = false;
                  clearTimeout(timer);
                }, 300);
                that.clickedOnce = true;
              }
              that.movingInfo.offsetX = that.cursorToChartOffset.x - node.x;
              that.movingInfo.offsetY = that.cursorToChartOffset.y - node.y;
            }).
            on('drag', async function() {
              const {x, y} = d3.event;
              node.x = x - that.movingInfo.offsetX;
              node.y = y - that.movingInfo.offsetY;

              let chart = document.getElementById('chart');
              let width = chart.clientWidth;
              let height = chart.clientHeight;
              if (node.x > width - 120) {
                node.x = width - 120;
              }
              if (node.x < 0) {
                node.x = 0;
              }
              if (node.y > height - 60) {
                node.y = height - 60;
              }
              if (node.y < 0) {
                node.y = 0;
              }

              await that.refresh();
              let expectX = Math.round(Math.round(node.x) / 10) * 10;
              let expectY = Math.round(Math.round(node.y) / 10) * 10;
              let guidelineDash = [5, 3];
              that.internalNodes.forEach(item => {
                if (item.id !== node.id) {
                  if (item.x === expectX) {
                    // vertical guideline
                    if (item.y < expectY) {
                      that.lineTo(item.x, item.y + 60, expectX, expectY, guidelineDash);
                    } else {
                      that.lineTo(expectX, expectY + 60, item.x, item.y, guidelineDash);
                    }
                  }
                  if (item.y === expectY) {
                    // horizontal guideline
                    if (item.x < expectX) {
                      that.lineTo(item.x + 120, item.y, expectX, expectY, guidelineDash);
                    } else {
                      that.lineTo(expectX + 120, expectY, item.x, item.y, guidelineDash);
                    }
                  }
                }
              });
            }).
            on('end', function() {
              node.x = Math.round(Math.round(node.x) / 10) * 10;
              node.y = Math.round(Math.round(node.y) / 10) * 10;
              that.refresh();
            });
        svg.append('rect').
            attr('x', node.x).
            attr('y', node.y).
            attr('width', 120).
            attr('height', 60).
            attr('stroke', borderColor).
            attr('stroke-width', '1px').
            style('cursor', 'move').
            attr('fill', 'transparent').
            call(drag);

        if (connectorVisible) {
          let connectorPosition = this.getConnectorPosition(node);
          for (let position in connectorPosition) {
            let positionElement = connectorPosition[position];
            let connector = svg.append('circle').
                attr('cx', positionElement.x).
                attr('cy', positionElement.y).
                attr('r', 4).
                attr('stroke', '#bbbbbb').
                attr('stroke-width', '1px').
                attr('fill', 'white').
                style('cursor', 'crosshair');
            connector.on('mousedown', function() {
              d3.event.stopPropagation();
              if (node.type === 'end') {
                return;
              }
              that.connectingInfo.source = node;
              that.connectingInfo.sourcePosition = position;
            }).on('mouseup', function() {
              d3.event.stopPropagation();
              if (that.connectingInfo.source) {
                if (that.connectingInfo.source.id !== node.id) {
                  // Node can't connect to itself
                  let tempId = +new Date();
                  let conn = {
                    source: {
                      id: that.connectingInfo.source.id,
                      position: that.connectingInfo.sourcePosition,
                    },
                    destination: {
                      id: node.id,
                      position: position,
                    },
                    id: tempId,
                    type: 'pass',
                    name: '通过',
                  };
                  that.internalConnections.push(conn);
                  that.refresh();
                }
                that.connectingInfo.source = null;
                that.connectingInfo.sourcePosition = null;
              }
            });
          }
        }
      },
      save() {
        this.$emit('save', this.internalNodes, this.internalConnections);
      },
      async remove() {
        if (this.currentNode) {
          let connections = this.internalConnections.filter(
              item => item.source.id === this.currentNode.id ||
                  item.destination.id === this.currentNode.id,
          );
          for (let connection of connections) {
            this.internalConnections.splice(this.internalConnections.indexOf(connection), 1);
          }
          this.internalNodes.splice(this.internalNodes.indexOf(this.currentNode), 1);
          this.currentNode = null;
        } else if (this.currentConnection) {
          let index = this.internalConnections.indexOf(this.currentConnection);
          this.internalConnections.splice(index, 1);
          this.currentConnection = null;
        }
        await this.refresh();
      },
    },
    mounted() {
      let that = this;
      that.internalNodes.splice(0, that.internalNodes.length);
      that.internalConnections.splice(0, that.internalConnections.length);
      that.nodes.forEach(node => {
        that.internalNodes.push(JSON.parse(JSON.stringify(node)));
      });
      that.connections.forEach(connection => {
        that.internalConnections.push(JSON.parse(JSON.stringify(connection)));
      });
      that.refresh();
      document.onkeydown = function(event) {
        switch (event.keyCode) {
          case 37:
            if (that.currentNode != null) {
              that.currentNode.x -= 10;
            }
            break;
          case 38:
            if (that.currentNode != null) {
              that.currentNode.y -= 10;
            }
            break;
          case 39:
            if (that.currentNode != null) {
              that.currentNode.x += 10;
            }
            break;
          case 40:
            if (that.currentNode != null) {
              that.currentNode.y += 10;
            }
            break;
          case 27:
            if (that.currentNode) {
              that.currentNode = null;
            } else if (that.currentConnection) {
              that.currentConnection = null;
            }
            break;
          case 46:
            that.remove();
            break;
          default:
            break;
        }
        that.refresh();
      };
    },
    computed: {
      hoveredNode() {
        let nodes = this.internalNodes.filter(
            item => item.x <= this.cursorToChartOffset.x &&
                (item.x + 120) >= this.cursorToChartOffset.x &&
                item.y <= this.cursorToChartOffset.y &&
                (item.y + 60) >= this.cursorToChartOffset.y);
        if (nodes.length <= 0) {
          return null;
        }

        return nodes[0];
      },
      hoveredConnector() {
        for (const node of this.internalNodes) {
          let connectorPosition = this.getConnectorPosition(node);
          for (let prop in connectorPosition) {
            let entry = connectorPosition[prop];
            if (Math.hypot(entry.x - this.cursorToChartOffset.x,
                entry.y - this.cursorToChartOffset.y) < 10) {
              return {position: prop, node: node};
            }
          }
        }
        return null;
      },
      hoveredConnection() {
        for (const line of this.lines) {
          let distance = distanceOfPointToLine(
              line.sourceX,
              line.sourceY,
              line.destinationX,
              line.destinationY,
              this.cursorToChartOffset.x,
              this.cursorToChartOffset.y,
          );
          if (
              distance < 5 &&
              between(line.sourceX - 2, line.destinationX + 2, this.cursorToChartOffset.x) &&
              between(line.sourceY - 2, line.destinationY + 2, this.cursorToChartOffset.y)
          ) {
            let connections = this.internalConnections.filter(item => item.id === line.id);
            return connections.length > 0 ? connections[0] : null;
          }
        }
        return null;
      },
      cursor() {
        if (this.connectingInfo.source || this.hoveredConnector) {
          return 'crosshair';
        }
        if (this.hoveredConnection != null) {
          return 'pointer';
        }
        return null;
      },
    },
    watch: {
      internalNodes: {
        immediate: true,
        deep: true,
        handler() {
          this.refresh();
        },
      },
    },
  };
</script>
