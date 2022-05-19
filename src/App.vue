<template>
  <div>
    <ColorPicker v-model="color" @change="changeColor"></ColorPicker>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'App',
  setup() {
    const color = ref('#FFFFFF')
    return {
      color
    }
  }
})
</script>
<style lang="less">
@import './packages/theme';
body, #app {
  padding: 0;
  margin: 0;
  background: yellowgreen;
}
</style>