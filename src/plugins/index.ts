import { App } from 'vue'
import ColorPicker from '../packages/ColorPicker/index.vue'
const components = [ColorPicker]

export default {
  install(app: App) {
    components.map(component => {
      app.component(component.name, component)
    })
  }
}
