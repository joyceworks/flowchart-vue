<template>
    <div id="chart" tabindex="0"
         :style="{width: isNaN(width) ? width : (width + 'px'), height: isNaN(height) ? height : (height + 'px'), cursor: cursor}"
         @mousemove="handleChartMouseMove" @mouseup="handleChartMouseUp"
         @dblclick="handleChartDblClick($event)" @mousewheel="handleChartMouseWheel"
         @mousedown="handleChartMouseDown($event)">
        <span id="position" class="unselectable">
            {{ cursorToChartOffset.x + ', ' + cursorToChartOffset.y }}
        </span>
        <svg id="svg"></svg>
    </div>
</template>
<style src="./style.css"></style>
<script>
  import {lineTo, line2} from '../../utils/svg';
  import * as d3 from 'd3';
  import {between, distanceOfPointToLine, getEdgeOfPoints} from '../../utils/math';
  import Vue from 'vue';
  import VueI18n from 'vue-i18n';

  Vue.use(VueI18n);

  const i18n = new VueI18n({
    locale: 'zh',
    messages: {
      'en': require('../../assets/locale/en'),
      'zh': require('../../assets/locale/zh'),
    },
  });

  export default {
    name: 'flowchart',
    props: {
      nodes: {
        type: Array,
        default: () => [
          {id: 1, x: 140, y: 270, name: i18n.t('message.start'), type: 'start'},
          {id: 2, x: 540, y: 270, name: i18n.t('message.end'), type: 'end'},
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
      locale: {
        type: String,
        default: 'en',
      },
      readonly: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        internalNodes: [],
        internalConnections: [],
        connectingInfo: {
          source: null,
          sourcePosition: null,
        },
        selectionInfo: null,
        currentNodes: [],
        currentConnections: [],
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
        if (this.readonly) {
          return;
        }
        let name = i18n.t('message.new');
        this.internalNodes.push({id: +new Date(), x: x, y: y, name: name, type: 'operation'});
      },
      editCurrent() {
        if (this.currentNodes.length === 1) {
          this.editNode(this.currentNodes[0]);
        } else if (this.currentConnections.length === 1) {
          this.editConnection(this.currentConnections[0]);
        }
      },
      editNode(node) {
        if (this.readonly) {
          return;
        }
        this.$emit('editnode', node);
      },
      editConnection(connection) {
        if (this.readonly) {
          return;
        }
        this.$emit('editconnection', connection);
      },
      handleChartMouseWheel(event) {
        event.stopPropagation();
        event.preventDefault();
        if (event.ctrlKey) {
          let svg = document.getElementById('svg');
          let zoom = parseFloat(svg.style.zoom || 1);
          if (event.deltaY > 0 && zoom === 0.1) {
            return;
          }
          zoom -= (event.deltaY / 100 / 10);
          svg.style.zoom = zoom;
        }
      },
      async handleChartMouseUp() {
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
                name: i18n.t('message.pass'),
              };
              this.internalConnections.push(conn);
            }
          }
          await this.refresh();
          this.connectingInfo.source = null;
          this.connectingInfo.sourcePosition = null;
        }
        if (this.selectionInfo) {
          this.selectionInfo = null;
          await this.refresh();
        }
      },
      async handleChartMouseMove(event) {
        // calc offset of cursor to chart
        let boundingClientRect = event.currentTarget.getBoundingClientRect();
        let actualX = event.pageX - boundingClientRect.left - window.scrollX;
        this.cursorToChartOffset.x = Math.trunc(actualX);
        let actualY = event.pageY - boundingClientRect.top - window.scrollY;
        this.cursorToChartOffset.y = Math.trunc(actualY);

        if (this.connectingInfo.source) {
          await this.refresh();

            d3.selectAll('#svg > .connector').classed('active', true);

          let sourceOffset = this.getNodeConnectorOffset(
              this.connectingInfo.source.id,
              this.connectingInfo.sourcePosition,
          );
          let destinationPosition = this.hoveredConnector ? this.hoveredConnector.position : null;
          this.arrowTo(sourceOffset.x, sourceOffset.y, this.cursorToChartOffset.x,
              this.cursorToChartOffset.y, this.connectingInfo.sourcePosition, destinationPosition,
          );
        } else if (this.selectionInfo) {
          await this.refresh();
        }
      },
      handleChartDblClick(event) {
        if (this.readonly) {
          return;
        }
        this.add(event.offsetX, event.offsetY);
        this.refresh();
      },
      handleChartMouseDown(event) {
        this.selectionInfo = {x: event.offsetX, y: event.offsetY};
      },
      getConnectorPosition(node) {
        let top = {x: node.x + 60, y: node.y};
        let left = {x: node.x, y: node.y + 30};
        let bottom = {x: node.x + 60, y: node.y + 60};
        let right = {x: node.x + 120, y: node.y + 30};
        return {left, right, top, bottom};
      },
      refresh() {
        let that = this;
        return new Promise(function(resolve) {
          that.$nextTick(function() {
            d3.selectAll('svg > *').remove();

            // render nodes
            that.internalNodes.forEach(node => {
              if (that.currentNodes.filter(item => item === node).length > 0) {
                that.renderNode(node, '#666666');
              } else {
                that.renderNode(node, '#bbbbbb');
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
              if (that.currentConnections.filter(item => item === conn).length > 0) {
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
                  that.currentNodes.splice(0, that.currentNodes.length);
                  that.currentConnections.splice(0, that.currentConnections.length);
                  that.currentConnections.push(conn);
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

            // render selection rectangle
            if (that.selectionInfo) {
              let edge = getEdgeOfPoints([
                {x: that.selectionInfo.x, y: that.selectionInfo.y},
                {x: that.cursorToChartOffset.x, y: that.cursorToChartOffset.y},
              ]);
              let svg = d3.select('#svg');
              svg.append('rect').
                  attr('x', edge.start.x).
                  attr('y', edge.start.y).
                  attr('width', edge.end.x - edge.start.x).
                  attr('height', edge.end.y - edge.start.y).
                  attr('stroke', 'lightblue').
                  attr('fill-opacity', 0.8).
                  attr('fill', 'lightblue');
            }

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
      renderNode(node, borderColor) {
        let that = this;
        let svg = d3.select('#svg');

        if (node.type !== 'start' && node.type !== 'end') {
          // title
          svg.append('rect').
              attr('x', node.x).
              attr('y', node.y).
              attr('stroke', borderColor).
              attr('class', 'title');
          svg.append('text').
              attr('x', node.x + 4).
              attr('y', node.y + 15).
              attr('class', 'unselectable').
              text(() => node.name).
              each(function wrap() {
                let self = d3.select(this),
                    textLength = self.node().getComputedTextLength(),
                    text = self.text();
                while (textLength > (120 - 2 * 4) && text.length > 0) {
                  text = text.slice(0, -1);
                  self.text(text + '...');
                  textLength = self.node().getComputedTextLength();
                }
              });
        }

        // body
        let body = svg.append('rect').attr('class', 'body');
        if (node.type !== 'start' && node.type !== 'end') {
          body.attr('x', node.x).attr('y', node.y + 20);
        } else {
          body.attr('x', node.x).attr('y', node.y).classed(node.type, true).attr('rx', 30);
        }
        body.attr('stroke', borderColor);

        // body text
        let text = node.type === 'start'
            ? i18n.t('message.start')
            : (node.type === 'end' ? i18n.t('message.end') : (
                    (!node.approvers || node.approvers.length === 0)
                        ? i18n.t('message.noApprover')
                        : (
                            node.approvers.length > 1
                                ? `${node.approvers[0].name + i18n.t('message.etc')}`
                                : node.approvers[0].name
                        )
                )
            );
        let bodyTextY;
        if (node.type !== 'start' && node.type !== 'end') {
          bodyTextY = node.y + 45;
        } else {
          bodyTextY = node.y + 35;
        }
        svg.append('text').
            attr('x', node.x + 60).
            attr('y', bodyTextY).
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
              // handle mousedown
              let isNotCurrentNode = that.currentNodes.filter(item => item === node).length === 0;
              if (isNotCurrentNode) {
                that.currentConnections.splice(0, that.currentConnections.length);
                that.currentNodes.splice(0, that.currentNodes.length);
                that.currentNodes.push(node);
              }

              if (that.clickedOnce) {
                that.editNode(node);
              } else {
                let timer = setTimeout(function() {
                  that.clickedOnce = false;
                  clearTimeout(timer);
                }, 300);
                that.clickedOnce = true;
              }
            }).
            on('drag', async function() {
              if (that.readonly) {
                return;
              }

              let zoom = parseFloat(document.getElementById('svg').style.zoom || 1);
              for (let currentNode of that.currentNodes) {
                currentNode.x += (d3.event.dx / zoom);
                currentNode.y += (d3.event.dy / zoom);
              }
              await that.refresh();

              let edge = that.getCurrentNodesEdge();
              let expectX = Math.round(Math.round(edge.start.x) / 10) * 10;
              let expectY = Math.round(Math.round(edge.start.y) / 10) * 10;
              let guidelineDash = [5, 3];
              that.internalNodes.forEach(item => {
                if (that.currentNodes.filter(currentNode => currentNode === item).length === 0) {
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
            }).on('end', function() {
              for (let currentNode of that.currentNodes) {
                currentNode.x = Math.round(Math.round(currentNode.x) / 10) * 10;
                currentNode.y = Math.round(Math.round(currentNode.y) / 10) * 10;
              }
              that.refresh();
            });
        let container = svg.append('rect').
            attr('class', 'container').
            attr('x', node.x).
            attr('y', node.y);
        if (node.type === 'start' || node.type === 'end') {
          container.attr('rx', 30).classed(node.type, true);
        }
        container.attr('stroke', borderColor).call(drag);
        container.on('mousedown', function() {
          // handle ctrl+mousedown
          if (!d3.event.ctrlKey) {
            return;
          }
          let isNotCurrentNode = that.currentNodes.filter(item => item === node).length === 0;
          if (isNotCurrentNode) {
            that.currentNodes.push(node);
          } else {
            that.currentNodes.splice(that.currentNodes.indexOf(node), 1);
          }
        });

        let connectors = [];
        let connectorPosition = this.getConnectorPosition(node);
        for (let position in connectorPosition) {
          let positionElement = connectorPosition[position];
          let connector = svg.append('circle').
              attr('cx', positionElement.x).
              attr('cy', positionElement.y).
              attr('r', 4).
              attr('class', 'connector');
          connector.on('mousedown', function() {
            d3.event.stopPropagation();
            if (node.type === 'end' || that.readonly) {
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
                  name: i18n.t('message.pass'),
                };
                that.internalConnections.push(conn);
                that.refresh();
              }
              that.connectingInfo.source = null;
              that.connectingInfo.sourcePosition = null;
            }
          }).on('mouseover', function() {
            connector.classed('active', true);
          }).on('mouseout', function() {
            connector.classed('active', false);
          });
          connectors.push(connector);
        }
        container.on('mouseover', function() {
          connectors.forEach(conn => conn.classed('active', true));
        }).on('mouseout', function() {
          connectors.forEach(conn => conn.classed('active', false));
        });
      },
      getCurrentNodesEdge() {
        let edgeOfPoints = getEdgeOfPoints(this.currentNodes);
        edgeOfPoints.x += 120;
        edgeOfPoints.y += 60;
        return edgeOfPoints;
      },
      save() {
        if (this.readonly) {
          return;
        }
        this.$emit('save', this.internalNodes, this.internalConnections);
      },
      async remove() {
        if (this.readonly) {
          return;
        }
        if (this.currentNodes.length > 0) {
          for (let node of this.currentNodes) {
            this.removeNode(node);
          }
          this.currentNodes.splice(0, this.currentNodes.length);
        }
        if (this.currentConnections.length > 0) {
          for (let conn of this.currentConnections) {
            this.removeConnection(conn);
          }
          this.currentConnections.splice(0, this.currentConnections.length);
        }
        await this.refresh();
      },
      removeNode(node) {
        let connections = this.internalConnections.filter(
            item => item.source.id === node.id || item.destination.id === node.id,
        );
        for (let connection of connections) {
          this.internalConnections.splice(this.internalConnections.indexOf(connection), 1);
        }
        this.internalNodes.splice(this.internalNodes.indexOf(node), 1);
      },
      removeConnection(conn) {
        let index = this.internalConnections.indexOf(conn);
        this.internalConnections.splice(index, 1);
      },
      moveCurrentNode(x, y) {
        if (this.currentNodes.length > 0 && !this.readonly) {
          for (let node of this.currentNodes) {
            node.x += x;
            node.y += y;
          }
        }
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
            that.moveCurrentNode(-10, 0);
            break;
          case 38:
            that.moveCurrentNode(0, -10);
            break;
          case 39:
            that.moveCurrentNode(10, 0);
            break;
          case 40:
            that.moveCurrentNode(0, 10);
            break;
          case 27:
            that.currentNodes.splice(0, that.currentNodes.length);
            that.currentConnections.splice(0, that.currentConnection.length);
            break;
          case 65:
            if (document.activeElement === document.getElementById('chart')) {
              that.currentNodes.splice(0, that.currentNodes.length);
              that.currentConnections.splice(0, that.currentConnections.length);
              that.currentNodes.push(...that.internalNodes);
              that.currentConnections.push(...that.internalConnections);
              event.preventDefault();
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
    created() {
      i18n.locale = this.locale;
    },
    computed: {
      hoveredNode() {
        let nodes = this.internalNodes.filter(
            item => item.x <= this.cursorToChartOffset.x &&
                (item.x + 120) >= this.cursorToChartOffset.x &&
                item.y <= this.cursorToChartOffset.y &&
                (item.y + 60) >= this.cursorToChartOffset.y);
        return nodes.length <= 0 ? null : nodes[0];
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
    i18n: i18n,
  };
</script>
