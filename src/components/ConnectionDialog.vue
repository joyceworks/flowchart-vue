<template>
    <div>
        <a-modal title="编辑" v-model="visible" width="440px" :keyboard="false" :closable="false"
                 :maskClosable="false">
            <a-form-model ref="form" :model="connectionForm" label-width="80px">
                <a-form-model-item label="名称">
                    <a-input v-model="connectionForm.name"/>
                </a-form-model-item>
                <a-form-model-item label="类型">
                    <a-select v-model="connectionForm.type" placeholder="请选择">
                        <a-select-option :key="'connection-type-' + item.id"
                                         v-for="item in [ { name: '通过', id: 'pass' }, { name: '驳回', id: 'reject' } ]"
                                         :value="item.id">
                            {{item.name}}
                        </a-select-option>
                    </a-select>
                </a-form-model-item>
                <a-form-model-item label="表达式">
                    <a-input v-model="connectionForm.expression"/>
                </a-form-model-item>
            </a-form-model>
            <span slot="footer" class="dialog-footer">
                <a-button @click="handleClickCancelSaveConnection">取消</a-button>
                <a-button type="primary" @click="handleClickSaveConnection">确定</a-button>
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
      connection: {
        type: Object,
        default: null,
      },
    },
    data() {
      return {
        connectionForm: {
          type: null,
          sourceId: null,
          sourcePosition: null,
          destinationId: null,
          destinationPosition: null,
          name: null,
          expression: null,
        },
      };
    },
    methods: {
      async handleClickSaveConnection() {
        this.$emit('update:visible', false);
        this.$emit('update:connection', Object.assign(this.connection, {
          name: this.connectionForm.name,
          type: this.connectionForm.type,
          expression: this.connectionForm.expression,
        }));
      },
      async handleClickCancelSaveConnection() {
        this.$emit('update:visible', false);
      },
    },
    watch: {
      connection: {
        immediate: true,
        handler(val) {
          if (!val) { return; }
          this.connectionForm.id = val.id;
          this.connectionForm.type = val.type;
          this.connectionForm.name = val.name;
          this.connectionForm.expression = val.expression;
        },
      },
    },
  };
</script>