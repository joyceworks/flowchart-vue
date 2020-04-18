<template>
    <div>
        <div class="modal" v-show="visible" style="width: 320px">
            <div class="header">
                <span>Edit</span>
            </div>
            <div class="body">
                <label for="name">Name</label>
                <input class="form-control" id="name" v-model="nodeForm.name"/>
                <label for="type">Type</label>
                <select class="form-control" id="type" v-model="nodeForm.type">
                    <option :key="'node-type-' + item.id" :value="item.id"
                            v-for="item in [ { name: 'Start', id: 'start' }, { name: 'End', id: 'end' }, { name: 'Operation', id: 'operation' } ]"
                    >
                        {{item.name}}
                    </option>
                </select>
            </div>
            <div class="footer">
                <button @click="handleClickCancelSaveNode">Cancel</button>
                <button @click="handleClickSaveNode">Ok</button>
            </div>
        </div>
    </div>
</template>
<script>
  import '../assets/modal.css';

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