<template>
  <div class="color-picker-panel" ref="el">
    <slot></slot>
    <div class="color-picker-trigger" :style="{'background-color':modelValue}"></div>
    <transition name="slide-toggle">
      <div v-show="visible" class="color-picker" @click.stop>
        <div class="color-picker-content">
          <Sidebar ref="sidebar" v-model="bgColor" :side-bar-height="sideBarHeight" />
          <Panel ref="panel" :bg-color="bgColor" :show-color="showColor" />
        </div>
        <div class="color-picker-control">
          <div class="color-input">
            <input type="text" class="input-control" :value="colorToRgba" @change="onChange">
          </div>
          <div class="color-confirm" @click="confirmClick" v-html="text"></div>
          <div class="color-confirm" @click="clearClick">重置</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import {defineComponent, reactive, toRefs, computed, nextTick, onMounted, ref, onBeforeUnmount} from 'vue'
import Sidebar from './sidebar.vue'
import Panel from './panel.vue'
import pType from './types/pType'
export interface AnyPropName {
  [propName: string]: any
}


export default defineComponent({
  name: 'ColorPicker',
  components: {Sidebar, Panel},
  props: {
    modelValue: pType.string('#ffffff'),
    format: pType.string('hex'),// // 显示格式，hex和rgb两种
    text: pType.string('确定')
  },
  emits:['update:modelValue','change'],
  setup(props, {emit}) {
    const el = ref()
    const sidebar = ref()
    const panel = ref()
    const state = reactive<AnyPropName>({
      visible: false,
      bgColor: { // 侧栏颜色
        r: null,
        g: null,
        b: null
      },
      showColor: { // 实际显示的颜色
        r: null,
        g: null,
        b: null
      },
      sideBarHeight: 0
    })
    const colorToRgba = computed(() => {
      if (state.showColor.r === null) return
      // 根据颜色格式返回数值
      let value
      if (props.format === 'hex') {
        value = RgbToHex()
      } else {
        const {r, g, b} = state.showColor
        value = `rgb(${r},${g},${b})`
      }
      value = value&&value.replace(/\s+/g, '')
      return value
    })
    const onChange = (evt?:any) => {
      let value = evt ? evt.target.value : props.modelValue
      // 过滤所有空格
      value = value.replace(/\s+/g, '')
      // 如果输入的第一位是#，则输入的是16进制的颜色
      let list
      if (value[0] === '#') {
        list = HexToRgb(value)
      } else {
        value = value.replace(/[a-zA-Z()]/g, '')
        list = value.split(',')
      }
      if (!list || (list.length !== 3 && list.length !== 4)) {
        return
      }
      state.showColor.r = calcColorNumber(list[0])
      state.showColor.g = calcColorNumber(list[1])
      state.showColor.b = calcColorNumber(list[2])
      // 修改完当前颜色，重新计算背景色
      calcBg(evt)
    }
    // 判断是否为16进制，返回一个色号rgb数组
    const HexToRgb = (value:string) => {
      let color = value.replace('#', '')
      // 判断格式，只能是3位和6位
      if (color.length !== 3 && color.length !== 6) return
      if (/[^0-9a-f]/g.test(color)) return
      // 将其转换成rgb色号数组 f00=>[255,0,0]
      let rgb = []
      for (let i = 0; i < color.length; i++) {
        let num = parseInt(color[i].toString() + color[i], 16)
        if (color.length === 6 && i % 2 === 0) {
          num = parseInt(color[i].toString() + color[i + 1], 16)
          rgb.push(num)
        } else if (color.length === 3) {
          rgb.push(num)
        }
      }
      return rgb
    }
    const RgbToHex = () => {
      let value = '#'
      for (let key in state.showColor) {
        if (key === 'a') continue
        if (state.showColor[key] === null) return

        let v = parseInt(state.showColor[key]).toString(16)
        if (v.length === 1) v += v
        value += v
      }
      return value
    }
    // 根据当前颜色，计算侧栏滑块的颜色
    const calcBg = (e:any) => {
      let {r, g, b} = state.showColor
      let newColor = [
        {name: 'r', value: r},
        {name: 'g', value: g},
        {name: 'b', value: b}
      ]
      newColor.sort((a, b) => {
        return b.value - a.value
      })
      let max = newColor[0].value
      let mid = newColor[1].value
      let min = newColor[2].value

      // 计算点像右延长至边界的点的色标
      newColor[1].value = ((min - mid) * max) / (min - max)
      newColor[2].value = 0

      newColor[0].value = 255
      newColor[1].value = (255 * newColor[1].value) / max

      if (min === max) {
        newColor[1].value = 0
      }
      newColor.forEach(e => {
        state.bgColor[e.name] = e.value
      })
      if (e) {
        sidebar.value.calcTop()
        panel.value.calcXY()
      }
    }
    // 判断输入的数值是否超出了范围
    const calcColorNumber = (cn:number) => {
      if (cn > 255) cn = 255
      if (cn < 0) cn = 0
      return cn
    }
    const confirmClick = (e:MouseEvent) => {
      console.log('---', colorToRgba.value)
      state.visible = false
      emit('update:modelValue', colorToRgba.value)
      emit('change', colorToRgba.value)
      e.stopPropagation()
    }
    const clearClick = (e:MouseEvent) => {
      state.visible = false
      emit('update:modelValue', 'transparent')
      emit('change', 'transparent')
      e.stopPropagation()
    }
    const showClick = (e:any) => {
      if (el.value.contains(e.target)) {
        state.visible = true
        nextTick(() => {
          const toBottomDistance = window.innerHeight - e.target.getBoundingClientRect().y - e.target.getBoundingClientRect().height
          if(toBottomDistance < 200) {
            el.value.querySelector('.color-picker').style.bottom = '100%'
          }
          state.sideBarHeight = el.value.querySelector('.color-slider').offsetHeight
          panel.value.calcXY()
        })
      } else {
        state.visible = false
      }
    }
    onMounted(() => {
      nextTick(() => {
        state.sideBarHeight = el.value.querySelector('.color-slider').offsetHeight
        onChange()
      })
      document.addEventListener('click', showClick)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', showClick)
    })
    return {
      ...toRefs(state),
      colorToRgba,
      el,
      sidebar,
      panel,
      confirmClick,
      clearClick,
      onChange
    }
  }
})
</script>
<style lang='less' scoped>

</style>
