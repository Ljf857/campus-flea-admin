<script setup lang="ts">
/**
 * 登录页
 * 逻辑：人机验证由「本地图形验证码」升级为「阿里云验证码 2.0（拼图验证）」——
 * 校验账号密码非空 → 唤起拼图验证 → 验证通过拿到 captchaVerifyParam → 提交登录。
 * 服务端会拿该参数向阿里云验签，前端无法伪造通过。
 * 视觉上保持「品牌区 + 表单区」双栏，<1024px 时品牌区收起，只留表单。
 */
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShieldCheck, TrendingUp, PackageCheck } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { getCaptchaConfigApi } from '@/api/modules/auth'
import {
  initAliyunCaptcha,
  type AliyunCaptchaInstance,
  type AliyunCaptchaSceneConfig,
} from '@/utils/aliyunCaptcha'
import BrandMark from '@/components/BrandMark/index.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
/** 服务端是否启用了人机验证（由 /admin/auth/captcha 下发） */
const captchaEnabled = ref(false)
/** 验证码实例是否已就绪 */
const captchaReady = ref(false)
/** 启用但组件初始化失败，此时拒绝登录并提示刷新 */
const captchaFailed = ref(false)

const form = reactive({
  username: '',
  password: '',
})

/** 用户主动关闭验证码弹窗（非验证失败） */
const CAPTCHA_CANCELLED = 'CAPTCHA_CANCELLED'

let captchaInstance: AliyunCaptchaInstance | null = null
let captchaScene: AliyunCaptchaSceneConfig | null = null

/** 一次登录点击对应一次人机验证，用 Promise 把 SDK 回调桥接成 async 流程 */
let pending: {
  resolve: (captchaVerifyParam: string) => void
  reject: (reason: Error) => void
  settled: boolean
} | null = null

function onCaptchaSuccess(captchaVerifyParam: string): void {
  const current = pending
  if (!current || current.settled) return
  current.settled = true
  pending = null
  current.resolve(captchaVerifyParam)
}

function onCaptchaFail(result: unknown): void {
  // 有效期内无需处理：验证码会自动刷新，用户重新完成拼图即可
  console.warn('[人机验证] 未通过', result)
}

function onCaptchaClose(): void {
  if (!pending) return
  // success 与 onClose 的触发次序在不同版本下可能不同，延后一拍再判定为「取消」
  window.setTimeout(() => {
    const current = pending
    if (!current || current.settled) return
    pending = null
    current.reject(new Error(CAPTCHA_CANCELLED))
  }, 500)
}

/** 初始化 / 重新初始化拼图验证控件 */
async function mountCaptcha(): Promise<void> {
  if (!captchaScene) return
  await initAliyunCaptcha({
    config: captchaScene,
    element: '#aliyun-captcha-element',
    button: '#aliyun-captcha-trigger',
    onSuccess: onCaptchaSuccess,
    onFail: onCaptchaFail,
    onClose: onCaptchaClose,
    onError: (error) => console.error('[人机验证] 初始化异常', error),
    getInstance: (instance) => {
      captchaInstance = instance
      captchaReady.value = true
    },
  })
}

async function setupCaptcha(): Promise<void> {
  let config: Awaited<ReturnType<typeof getCaptchaConfigApi>>
  try {
    config = await getCaptchaConfigApi()
  } catch {
    // 取不到配置时按「未启用」降级，避免网络抖动直接把登录页卡死
    captchaEnabled.value = false
    return
  }

  if (!config?.enabled || !config.sceneId || !config.prefix) {
    captchaEnabled.value = false
    return
  }

  captchaEnabled.value = true
  captchaScene = {
    sceneId: config.sceneId,
    prefix: config.prefix,
    region: config.region || 'cn',
  }

  try {
    await mountCaptcha()
  } catch {
    captchaFailed.value = true
    ElMessage.error('人机验证组件加载失败，请检查网络后刷新页面')
  }
}

/**
 * 一次验证周期结束后必须重新初始化，才能再次发起验证
 */
function resetCaptcha(): void {
  if (!captchaEnabled.value || captchaFailed.value) return
  try {
    captchaInstance?.hide()
  } catch {
    // 忽略：实例可能已随验证周期结束而失效
  }
  captchaInstance = null
  captchaReady.value = false
  mountCaptcha().catch(() => {
    captchaFailed.value = true
  })
}

/** 唤起拼图验证并等待其返回验证参数 */
function requestCaptchaVerify(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!captchaReady.value || !captchaInstance) {
      reject(new Error('CAPTCHA_NOT_READY'))
      return
    }
    pending = { resolve, reject, settled: false }
    captchaInstance.show()
  })
}

async function handleLogin(): Promise<void> {
  if (loading.value) return
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  if (captchaFailed.value) {
    ElMessage.error('人机验证组件未就绪，请刷新页面后重试')
    return
  }

  loading.value = true
  try {
    let captchaVerifyParam = ''
    if (captchaEnabled.value) {
      try {
        captchaVerifyParam = await requestCaptchaVerify()
      } catch (error) {
        if (error instanceof Error && error.message === CAPTCHA_CANCELLED) {
          ElMessage.info('已取消人机验证')
        } else {
          ElMessage.error('人机验证启动失败，请刷新页面后重试')
        }
        return
      }
    }

    await userStore.login({
      username: form.username,
      password: form.password,
      captchaVerifyParam,
    })
    ElMessage.success('登录成功')
    router.replace((route.query.redirect as string) || '/dashboard')
  } catch {
    ElMessage.error('登录失败，请检查账号密码')
    // 一次验证只能用于一次登录尝试，失败后需重新验证
    resetCaptcha()
  } finally {
    loading.value = false
  }
}

const highlights = [
  { icon: PackageCheck, title: '商品审核', desc: '批量处理待审商品，违规内容一键下架' },
  { icon: ShieldCheck, title: '实名认证', desc: '核验学生身份，保障交易双方真实可信' },
  { icon: TrendingUp, title: '运营看板', desc: '用户、商品、订单趋势一屏掌握' },
]

onMounted(setupCaptcha)

onBeforeUnmount(() => {
  pending = null
  try {
    captchaInstance?.destroyCaptcha?.()
  } catch {
    // 忽略：页面已在卸载，失败无影响
  }
  captchaInstance = null
})
</script>

<template>
  <div class="flex min-h-screen bg-page">
    <!-- 品牌区：<1024px 收起 -->
    <aside
      class="on-dark relative hidden w-[46%] max-w-[560px] shrink-0 flex-col justify-between overflow-hidden border-r border-white/8 bg-sidebar p-10 lg:flex xl:p-14"
    >
      <!-- 极淡的网格底纹，给深色面一点科技质感，不抢内容 -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style="
          background-image:
            linear-gradient(to right, #fff 1px, transparent 1px),
            linear-gradient(to bottom, #fff 1px, transparent 1px);
          background-size: 48px 48px;
        "
      ></div>

      <div class="relative flex items-center gap-3">
        <BrandMark size="md" />
        <div>
          <p class="text-sm font-semibold text-white">校园跳蚤</p>
          <p class="text-2xs text-white/45">管理后台</p>
        </div>
      </div>

      <div class="relative">
        <h2 class="text-2xl font-semibold leading-tight text-white">
          让校园里的每一次<br />闲置流转都可信可控
        </h2>
        <p class="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
          面向校园二手交易平台运营人员的统一管理入口，覆盖用户、商品、订单、举报的完整治理链路。
        </p>

        <ul class="mt-8 flex flex-col gap-4">
          <li v-for="item in highlights" :key="item.title" class="flex items-start gap-3">
            <span
              class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-white/8 text-white/80"
              aria-hidden="true"
            >
              <component :is="item.icon" :size="15" />
            </span>
            <span>
              <span class="block text-sm font-medium text-white">{{ item.title }}</span>
              <span class="block text-2xs text-white/50">{{ item.desc }}</span>
            </span>
          </li>
        </ul>
      </div>

      <p class="relative text-2xs text-white/35">
        © {{ new Date().getFullYear() }} 校园跳蚤 · 校园二手交易平台
      </p>
    </aside>

    <!-- 表单区 -->
    <main class="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div class="w-full max-w-[380px]">
        <!-- 小屏补一个品牌标识，否则左侧品牌区收起后页面没有落点 -->
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandMark size="md" />
          <span>
            <span class="block text-sm font-semibold text-ink">校园跳蚤</span>
            <span class="block text-2xs text-muted">管理后台</span>
          </span>
        </div>

        <h1 class="text-xl font-semibold text-ink">登录管理后台</h1>
        <p class="mt-1.5 text-sm text-muted">请使用管理员账号登录，账号由系统管理员统一分配</p>

        <el-form
          class="mt-7"
          label-position="top"
          size="large"
          @submit.prevent="handleLogin"
          @keyup.enter="handleLogin"
        >
          <el-form-item label="账号">
            <el-input
              v-model="form.username"
              placeholder="请输入管理员账号"
              autocomplete="username"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              show-password
              :disabled="loading"
            />
          </el-form-item>

          <!-- 阿里云验证码 2.0 拼图验证：点击登录后弹出，此处只作状态说明 -->
          <el-form-item v-if="captchaEnabled" label="安全验证">
            <div
              class="flex w-full items-start gap-2 rounded-md border px-3 py-2.5 text-2xs"
              :class="
                captchaFailed
                  ? 'border-danger/30 bg-danger-soft text-danger'
                  : 'border-line bg-subtle text-muted'
              "
            >
              <ShieldCheck :size="15" class="mt-px shrink-0" aria-hidden="true" />
              <span>
                {{
                  captchaFailed
                    ? '人机验证组件加载失败，请刷新页面后重试'
                    : '点击登录后弹出阿里云拼图验证，完成验证方可登录'
                }}
              </span>
            </div>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="mt-2 w-full"
            :loading="loading"
            native-type="submit"
            @click="handleLogin"
          >
            {{ loading ? '登录中…' : '登录' }}
          </el-button>
        </el-form>

        <p class="mt-6 text-center text-2xs text-muted">
          忘记密码请联系系统管理员重置
        </p>
      </div>
    </main>

    <!--
      阿里云验证码 SDK 要求的挂载点：
      element 用于渲染验证码，button 用于触发验证，均可为隐藏元素；
      弹出式下真正的唤起由 captcha 实例的 show() 方法完成（见官方 FAQ Q5）。
      button 用「移出可视区」而不是 display:none，避免部分版本取不到可交互元素。
    -->
    <div id="aliyun-captcha-element" aria-hidden="true"></div>
    <button
      id="aliyun-captcha-trigger"
      type="button"
      tabindex="-1"
      aria-hidden="true"
      style="position: fixed; left: -9999px; top: 0"
    >
      人机验证
    </button>
  </div>
</template>
