<template>
    <div>
        <a-modal title="编辑" v-model="visible" width="440px" :keyboard="false" :closable="false"
                 :maskClosable="false">
            <a-form-model ref="form" :model="nodeForm" label-width="80px">
                <a-form-model-item label="名称">
                    <a-input v-model="nodeForm.name"/>
                </a-form-model-item>
                <a-form-model-item label="类型">
                    <a-select v-model="nodeForm.type" placeholder="请选择" style="width: 100%;">
                        <a-select-option :key="'node-type-' + item.id" :value="item.id"
                                         v-for="item in [ { name: '开始', id: 'start' }, { name: '结束', id: 'end' }, { name: '审批', id: 'operation' } ]"
                        >
                            {{item.name}}
                        </a-select-option>
                    </a-select>
                </a-form-model-item>
            </a-form-model>
            <span slot="footer" class="dialog-footer">
                <a-button @click="handleClickCancelSaveNode">取消</a-button>
                <a-button type="primary" @click="handleClickSaveNode">确定</a-button>
            </span>
        </a-modal>
    </div>
</template>
<script>
  export default {
    props: {
      visible: {
        type: Boolean,
        default: false,
      },
      node: {
        type: Object,
        default: null,
      },
    },
    data: function() {
      return {
        nodeForm: {name: null, id: null, type: null, approvers: []},
      };
    },
    methods: {
      handleClickSaveNode() {
        this.$emit('update:node', Object.assign(this.node, {
          name: this.nodeForm.name,
          type: this.nodeForm.type,
          approvers: this.nodeForm.approvers.map(item => Object.assign({}, item)),
        }));
        this.$emit('update:visible', false);
      },
      handleClickCancelSaveNode() {
        this.$emit('update:visible', false);
      },
    },
    watch: {
      node: {
        immediate: true,
        handler(val) {
          if (!val) { return; }
          this.nodeForm.id = val.id;
          this.nodeForm.name = val.name;
          this.nodeForm.type = val.type;
        },
      },
    },
  };
</script>