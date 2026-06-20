/**
 * 阿里云验证码 2.0（拼图验证）前端接入封装。
 *
 * 接入按官方要求分三步（缺一不可）：
 *  1. 注入全局变量 `window.AliyunCaptchaConfig`（region + 身份标 prefix）；
 *  2. 动态引入验证码主 JS —— 必须动态加载，禁止下载后本地部署，
 *     否则验证码无法更新，甚至引起误拦截；
 *  3. 调用 `window.initAliyunCaptcha` 完成初始化。
 *
 * 注意：`initAliyunCaptcha` 不支持随意重复调用；仅在验证生命周期结束
 * （一次验证已用于一次业务请求）后，才需要重新调用以开启下一轮验证。
 */

/** 后端下发的人机验证配置 */
export interface AliyunCaptchaSceneConfig {
  /** 场景 ID */
  sceneId: string
  /** 身份标 prefix */
  prefix: string
  /** 实例地域：cn-中国内地、sgp-新加坡，需要与服务端 endpoint 对应 */
  region: string
}

/** 验证码实例（用于手动 show/hide/refresh/destroy） */
export interface AliyunCaptchaInstance {
  show: () => void
  hide: () => void
  refresh: () => void
  destroyCaptcha?: () => void
}

export interface AliyunCaptchaInitOptions {
  config: AliyunCaptchaSceneConfig
  /** 渲染验证码的元素选择器，需在 DOM 中预留 */
  element: string
  /** 触发验证码的元素选择器，需在 DOM 中预留（可为隐藏元素） */
  button: string
  /** 验证通过回调，入参需原样透传给业务服务端 */
  onSuccess: (captchaVerifyParam: string) => void
  /** 验证不通过回调（有效期内无需处理，验证码会自动刷新） */
  onFail?: (result: unknown) => void
  /** 弹窗关闭回调 */
  onClose?: () => void
  /** 初始化请求 / 资源加载失败回调 */
  onError?: (error: { code?: string; msg?: string }) => void
  /** 绑定验证码实例 */
  getInstance?: (instance: AliyunCaptchaInstance) => void
}

declare global {
  interface Window {
    AliyunCaptchaConfig?: { region: string; prefix: string }
    initAliyunCaptcha?: (options: Record<string, unknown>) => void
  }
}

const SCRIPT_ID = 'aliyun-captcha-sdk'
const SCRIPT_SRC = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'

let scriptPromise: Promise<void> | null = null

/**
 * 动态引入阿里云验证码主 JS（同一页面只引入一次）
 */
export function loadAliyunCaptchaScript(): Promise<void> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window.initAliyunCaptcha === 'function') {
      resolve()
      return
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('阿里云验证码脚本加载失败')),
      )
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'text/javascript'
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('阿里云验证码脚本加载失败，请检查网络'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * 初始化拼图验证码（弹出式）
 */
export async function initAliyunCaptcha(options: AliyunCaptchaInitOptions): Promise<void> {
  const { config, element, button, onSuccess, onFail, onClose, onError, getInstance } = options

  // 必须在引入主 JS 之前注入，且初始化时参数变化需要同步更新
  window.AliyunCaptchaConfig = {
    region: config.region || 'cn',
    prefix: config.prefix,
  }

  await loadAliyunCaptchaScript()

  if (typeof window.initAliyunCaptcha !== 'function') {
    throw new Error('阿里云验证码 SDK 未就绪')
  }

  window.initAliyunCaptcha({
    // 场景 ID 由后端下发，避免前端硬编码
    SceneId: config.sceneId,
    // popup: 弹出式，点击登录后唤起拼图验证
    mode: 'popup',
    element,
    button,
    success: onSuccess,
    fail: onFail,
    onClose,
    onError,
    getInstance,
    language: 'cn',
    // 默认验证成功后延迟 1s 才回调，登录场景不需要这段等待，关掉以免拖慢交互
    delayBeforeSuccess: false,
    // 提示条保持默认开启，网络异常时用户能看到原因
    showErrorTip: true,
  })
}
