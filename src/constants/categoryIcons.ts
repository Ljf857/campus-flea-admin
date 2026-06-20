import type { Component } from 'vue'
import {
  BookOpen, GraduationCap, BookMarked, Calculator, Languages,
  MonitorSmartphone, Laptop, Tablet, Smartphone, Headphones, Mouse, Camera,
  Watch, Tv, Printer, Speaker, Gamepad2, Guitar, Palette,
  Shirt, Smile, Gem, Footprints, Backpack, ShoppingBag,
  Dumbbell, Volleyball, Bike, MountainSnow, Zap,
  Car, Bus, Train, Plane,
  Coffee, Utensils, Salad, Microwave, Refrigerator, Bed, Armchair, Sofa,
  Lightbulb, ShowerHead,
  FlaskConical, PawPrint, Puzzle, Baby, Gift,
  Wrench, Hammer, Sparkles,
  Package, Boxes, Tag, Store,
} from 'lucide-vue-next'

/**
 * 分类图标目录。
 *
 * ### 为什么是一份固定目录，而不是让后台随便填
 *
 * `value` 是存进数据库的值，移动端 `CategoryIcons.kt` 用它去查 Material 图标。
 * 移动端是一张静态映射表，表里没有的名字会**静默回退成通用图标**——
 * 之前后台可选 27 个图标、移动端只认 25 个，管理员选了 `Skirt` / `Shoes`
 * 之后移动端显示的是「卖」图标，界面上没有任何提示。
 *
 * 所以这份目录就是唯一事实来源：**这里有的，移动端一定有**。
 * 新增图标时必须同步改 `CategoryIcons.kt`，否则会重新引入同一个问题。
 *
 * ### 为什么预览图形用 Lucide 而不是 Material Symbols
 *
 * 移动端画的是 Material Symbols Rounded。精确还原需要引入 Google Fonts CDN，
 * 而 `fonts.googleapis.com` 在国内网络下经常不可达——图标会全部变成豆腐块或原始文本，
 * 那比「图形略有差异」糟糕得多。Lucide 是本项目已有的 npm 依赖，构建时打包、离线可用。
 *
 * 因此**请按中文含义选图标，不要按图形选**：预览图形只用于帮助定位，
 * 真正决定移动端长相的是 `value`。
 */
export interface CategoryIconOption {
  /** 存库值，与移动端 CategoryIcons.kt 的映射键一一对应 */
  value: string
  /** 中文含义 */
  label: string
  /** 预览图形（Lucide） */
  icon: Component
}

export interface CategoryIconGroup {
  group: string
  options: CategoryIconOption[]
}

export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  {
    group: '学习教材',
    options: [
      { value: 'MenuBook', label: '教材书籍', icon: BookOpen },
      { value: 'School', label: '专业课程', icon: GraduationCap },
      { value: 'Book', label: '考研资料', icon: BookMarked },
      { value: 'Calculate', label: '数理理工', icon: Calculator },
      { value: 'Translate', label: '外语学习', icon: Languages },
    ],
  },
  {
    group: '数码电子',
    options: [
      { value: 'Devices', label: '数码产品', icon: MonitorSmartphone },
      { value: 'Laptop', label: '笔记本电脑', icon: Laptop },
      { value: 'Tablet', label: '平板电脑', icon: Tablet },
      { value: 'PhoneAndroid', label: '手机', icon: Smartphone },
      { value: 'Headphones', label: '耳机音响', icon: Headphones },
      { value: 'Speaker', label: '音箱设备', icon: Speaker },
      { value: 'Mouse', label: '键鼠外设', icon: Mouse },
      { value: 'CameraAlt', label: '相机摄影', icon: Camera },
      { value: 'Watch', label: '智能穿戴', icon: Watch },
      { value: 'Tv', label: '显示器电视', icon: Tv },
      { value: 'Print', label: '打印机', icon: Printer },
      { value: 'SportsEsports', label: '游戏设备', icon: Gamepad2 },
    ],
  },
  {
    group: '服饰美妆',
    options: [
      { value: 'Checkroom', label: '服饰鞋包', icon: Shirt },
      { value: 'Face', label: '美妆护肤', icon: Smile },
      { value: 'Diamond', label: '饰品配件', icon: Gem },
      { value: 'DirectionsWalk', label: '鞋靴', icon: Footprints },
      { value: 'Backpack', label: '箱包', icon: Backpack },
      { value: 'ShoppingBag', label: '购物袋', icon: ShoppingBag },
    ],
  },
  {
    group: '运动户外',
    options: [
      { value: 'FitnessCenter', label: '健身器材', icon: Dumbbell },
      { value: 'SportsBasketball', label: '球类运动', icon: Volleyball },
      { value: 'PedalBike', label: '自行车', icon: Bike },
      { value: 'Hiking', label: '户外装备', icon: MountainSnow },
      { value: 'Skateboarding', label: '滑板轮滑', icon: Zap },
    ],
  },
  {
    group: '出行代步',
    options: [
      { value: 'ElectricRickshaw', label: '电动车', icon: Car },
      { value: 'DirectionsBus', label: '公交卡券', icon: Bus },
      { value: 'Train', label: '火车票券', icon: Train },
      { value: 'Flight', label: '机票旅游', icon: Plane },
    ],
  },
  {
    group: '生活用品',
    options: [
      { value: 'Coffee', label: '生活用品', icon: Coffee },
      { value: 'Kitchen', label: '厨具餐具', icon: Utensils },
      { value: 'LunchDining', label: '食品零食', icon: Salad },
      { value: 'Microwave', label: '宿舍电器', icon: Microwave },
      { value: 'AcUnit', label: '冰箱冷柜', icon: Refrigerator },
      { value: 'Bed', label: '床品寝具', icon: Bed },
      { value: 'Chair', label: '桌椅家具', icon: Armchair },
      { value: 'Weekend', label: '沙发软装', icon: Sofa },
      { value: 'Lightbulb', label: '灯具照明', icon: Lightbulb },
      { value: 'Shower', label: '洗护清洁', icon: ShowerHead },
    ],
  },
  {
    group: '兴趣娱乐',
    options: [
      { value: 'MusicNote', label: '乐器音乐', icon: Guitar },
      { value: 'Palette', label: '绘画手工', icon: Palette },
      { value: 'Science', label: '实验器材', icon: FlaskConical },
      { value: 'Pets', label: '宠物用品', icon: PawPrint },
      { value: 'Extension', label: '玩具模型', icon: Puzzle },
      { value: 'ChildCare', label: '母婴用品', icon: Baby },
      { value: 'CardGiftcard', label: '礼品文创', icon: Gift },
    ],
  },
  {
    group: '维修工具',
    options: [
      { value: 'Handyman', label: '五金工具', icon: Wrench },
      { value: 'Construction', label: '维修器材', icon: Hammer },
      { value: 'AutoAwesome', label: '清洁用品', icon: Sparkles },
    ],
  },
  {
    group: '其他',
    options: [
      { value: 'Inventory2', label: '其他杂物', icon: Package },
      { value: 'Inventory', label: '批量转让', icon: Boxes },
      { value: 'Storefront', label: '店铺 / 合集', icon: Store },
      { value: 'Sell', label: '通用（兜底）', icon: Tag },
    ],
  },
]

/** 扁平索引：值 -> 选项，供回显与校验使用 */
export const CATEGORY_ICON_MAP: Record<string, CategoryIconOption> = Object.fromEntries(
  CATEGORY_ICON_GROUPS.flatMap((g) => g.options).map((o) => [o.value, o]),
)

/** 移动端可识别的全部图标名 */
export const SUPPORTED_ICON_VALUES = new Set(Object.keys(CATEGORY_ICON_MAP))

export function findIconOption(value: string): CategoryIconOption | undefined {
  return CATEGORY_ICON_MAP[value]
}

/**
 * 该值移动端是否认得。
 *
 * false 表示存进去会被移动端回退成通用图标——历史上正是因为缺少这个校验，
 * 才出现「后台选了图标、App 显示另一个」却无人察觉的情况。
 */
export function isIconSupported(value: string): boolean {
  if (!value) return true
  // 自定义上传的图片，移动端直接当图片渲染，不查映射表
  if (value.startsWith('http://') || value.startsWith('https://')) return true
  return SUPPORTED_ICON_VALUES.has(value)
}
