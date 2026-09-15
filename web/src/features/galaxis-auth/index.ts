/*
 * Galaxis 定制登录 / 注册页。
 *
 * 这个目录整体是新增的，不覆盖上游任何文件；对上游的改动只有
 * routes/(auth)/sign-in.tsx 与 sign-up.tsx 里各一行 import 的替换。
 * 上游原来的 features/auth/sign-in、sign-up 原封不动保留——
 * 既是回滚开关（改回一行 import 即可），也避免了合并时的大面积冲突。
 */
export { GalaxisSignIn } from './sign-in'
export { GalaxisSignUp } from './sign-up'
