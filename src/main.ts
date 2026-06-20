import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import '@/styles/index.css'

import App from './App.vue'
import router from './router'
import { useAppStore } from '@/stores/app'
import { setupSelectAutoWidth } from '@/utils/selectAutoWidth'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
setupSelectAutoWidth(app)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

const appStore = useAppStore()
appStore.applyTheme()
appStore.initDevice()

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global error]:', err, info)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled rejection]:', event.reason)
})
