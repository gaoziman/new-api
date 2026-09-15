/*
 * 密码强度评估。
 *
 * 规则来自客户原型，未改动：按「长度 + 字符种类」分三档。
 * 单独成文件是因为它是纯函数，可以直接测——注册页里唯一有分支逻辑的部分，
 * 混在组件里就只能靠点页面来验证。
 *
 * 注意：这只是给用户的提示，不是准入条件。真正的口令策略由服务端决定，
 * 前端不拿它拦提交（弱口令仍可注册，与上游行为保持一致）。
 */

export type StrengthLevel = 0 | 1 | 2 | 3

export interface Strength {
  level: StrengthLevel
  text: string
}

/** 空密码返回 level 0，调用方据此隐藏强度条。 */
export function assessPassword(value: string): Strength {
  if (!value) return { level: 0, text: '' }

  let kinds = 0
  if (/[a-z]/.test(value)) kinds++
  if (/[A-Z]/.test(value)) kinds++
  if (/[0-9]/.test(value)) kinds++
  if (/[^a-zA-Z0-9]/.test(value)) kinds++

  // 两档门槛都自带长度下限（8 / 12），所以不足 8 位时 level 必然停在 1，
  // 不需要再补一个「压回最低档」的守卫——原型里那行是不可达的死代码。
  let level: StrengthLevel = 1
  if (value.length >= 8 && kinds >= 2) level = 2
  if (value.length >= 12 && kinds >= 3) level = 3

  let text: string
  if (level >= 3) {
    text = '强度不错'
  } else if (level === 2) {
    text = '强度一般，够用'
  } else if (value.length < 8) {
    text = '太短了，至少 8 个字符'
  } else {
    text = '强度偏弱，建议混合字母和数字'
  }

  return { level, text }
}
