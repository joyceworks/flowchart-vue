<template>
    <div>
        <el-dialog title="编辑" :visible.sync="visible" width="440px"
                   :before-close="handleClickCancelSaveConnection"
        >
            <el-form ref="form" :model="connectionForm" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="connectionForm.name"/>
                </el-form-item>
                <el-form-item label="类型">
                    <el-select v-model="connectionForm.type" placeholder="请选择"
                               style="width: 100%;"
                    >
                        <el-option :key="'connection-type-' + item.id"
                                   v-for="item in [ { name: '通过', id: 'pass' }, { name: '驳回', id: 'reject' } ]"
                                   :label="item.name"
                                   :value="item.id"
                        >
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="表达式">
                    <el-input v-model="connectionForm.expression"/>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="handleClickCancelSaveConnection">取消</el-button>
                <el-button type="primary" @click="handleClickSaveConnection">确定</el-button>
            </span>
        </el-dialog>
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